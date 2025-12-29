"""音频数据增强模块，使用 torchaudio 替代 yeaudio

使用 torchaudio 而非 librosa 的原因：
1. RISC-V 友好 - torchaudio 作为 PyTorch 生态一部分，有更好的 RISC-V 支持
2. 统一框架 - 避免多个依赖库，所有操作基于 PyTorch 张量
3. 更少外部依赖 - 不需要 numba, soundfile 等第三方库
4. 轮子现成 - PyTorch RISC-V 轮子中已包含 torchaudio
"""

import os
import random
from io import BytesIO

import numpy as np
import torch
import torchaudio
import torchaudio.functional as F
import soundfile as sf  # 用于音频加载，避免 torchcodec 依赖


class AudioSegment:
    """替代 yeaudio.AudioSegment 的音频处理类 - 使用 torchaudio 实现"""

    def __init__(self, samples, sample_rate):
        """初始化音频段
        
        :param samples: numpy array 或 torch tensor 格式的音频样本
        :param sample_rate: 采样率
        """
        # 确保 samples 是 numpy 数组格式存储（便于与原代码兼容）
        if isinstance(samples, torch.Tensor):
            self.samples = samples.cpu().numpy().astype(np.float32)
        else:
            self.samples = np.asarray(samples, dtype=np.float32)
        self.sample_rate = sample_rate

    @classmethod
    def from_file(cls, file_path):
        """从文件加载音频
        
        :param file_path: 音频文件路径
        :return: AudioSegment对象
        """
        try:
            # 使用 soundfile 加载音频（避免 torchaudio 的 torchcodec 依赖）
            samples, sr = sf.read(file_path, dtype='float32')
            # 如果是立体声，转换为单声道
            if len(samples.shape) > 1:
                samples = np.mean(samples, axis=1)
            return cls(samples, sr)
        except Exception as e:
            raise RuntimeError(f"Failed to load audio from {file_path}: {e}")

    @classmethod
    def from_bytes(cls, audio_bytes, sr=None):
        """从字节加载音频
        
        :param audio_bytes: 音频字节数据
        :param sr: 采样率，如果为None则使用原始采样率
        :return: AudioSegment对象
        """
        try:
            # 使用 soundfile 从字节流加载
            audio_io = BytesIO(audio_bytes)
            samples, sample_rate = sf.read(audio_io, dtype='float32')
            
            # 如果是立体声，转换为单声道
            if len(samples.shape) > 1:
                samples = np.mean(samples, axis=1)
            
            # 如果指定了采样率，则重采样
            if sr is not None and sr != sample_rate:
                # 创建临时对象用于重采样
                temp_seg = cls(samples, sample_rate)
                temp_seg.resample(sr)
                return temp_seg
            
            return cls(samples, sample_rate)
        except Exception as e:
            raise RuntimeError(f"Failed to load audio from bytes: {e}")

    @classmethod
    def from_ndarray(cls, samples, sample_rate):
        """从numpy数组创建音频段
        
        :param samples: numpy array格式的音频样本
        :param sample_rate: 采样率
        :return: AudioSegment对象
        """
        return cls(samples, sample_rate)

    def resample(self, target_sr):
        """重采样
        
        :param target_sr: 目标采样率
        """
        if target_sr == self.sample_rate:
            return
        
        # 转换为 torch tensor
        waveform = torch.from_numpy(self.samples).unsqueeze(0)
        
        # 使用 torchaudio 的重采样器
        resampler = torchaudio.transforms.Resample(
            orig_freq=self.sample_rate,
            new_freq=target_sr
        )
        resampled = resampler(waveform).squeeze(0)
        
        # 转换回 numpy
        self.samples = resampled.numpy().astype(np.float32)
        self.sample_rate = target_sr

    def normalize(self, target_db=-20):
        """音量归一化
        
        :param target_db: 目标分贝数
        """
        # 计算当前RMS
        rms = np.sqrt(np.mean(self.samples ** 2))
        if rms == 0 or np.isnan(rms):
            return
        
        # 计算目标RMS (dB to linear)
        target_rms = 10 ** (target_db / 20.0)
        
        # 缩放音频
        scaling_factor = target_rms / rms
        self.samples = self.samples * scaling_factor
        
        # 防止溢出，裁剪到[-1.0, 1.0]
        self.samples = np.clip(self.samples, -1.0, 1.0)

    def crop(self, duration=None, mode='train'):
        """裁剪音频到指定长度
        
        :param duration: 目标时长（秒）
        :param mode: 裁剪模式，'train'表示随机裁剪，其他表示从开头裁剪
        """
        if duration is None or duration >= self.duration:
            return
        
        crop_samples = int(duration * self.sample_rate)
        if crop_samples >= len(self.samples):
            return
        
        if mode == 'train':
            # 随机选择裁剪起点
            max_start = len(self.samples) - crop_samples
            if max_start > 0:
                start = random.randint(0, max_start)
            else:
                start = 0
        else:
            # 从开头裁剪
            start = 0
        
        self.samples = self.samples[start:start + crop_samples]

    @property
    def duration(self):
        """返回音频时长（秒）"""
        return len(self.samples) / self.sample_rate


class SpeedPerturbAugmentor:
    """速度扰动增强器 - 使用 torchaudio"""

    def __init__(self, min_speed_rate=0.9, max_speed_rate=1.1, **kwargs):
        """初始化速度扰动增强器
        
        :param min_speed_rate: 最小速度率
        :param max_speed_rate: 最大速度率
        """
        self.min_speed_rate = min_speed_rate
        self.max_speed_rate = max_speed_rate

    def __call__(self, audio_segment):
        """应用速度扰动
        
        :param audio_segment: AudioSegment对象
        :return: 修改后的AudioSegment对象
        """
        speed_rate = random.uniform(self.min_speed_rate, self.max_speed_rate)
        
        # 转换为 torch tensor
        waveform = torch.from_numpy(audio_segment.samples).unsqueeze(0)
        
        # 使用 torchaudio 的速度变换
        samples_stretched = F.speed(waveform, speed_rate)
        
        # 转换回 numpy
        samples = samples_stretched.squeeze(0).numpy().astype(np.float32)
        
        return AudioSegment(samples, audio_segment.sample_rate)


class VolumePerturbAugmentor:
    """音量扰动增强器 - 使用 torchaudio"""

    def __init__(self, min_gain_dBFS=-15, max_gain_dBFS=15, **kwargs):
        """初始化音量扰动增强器
        
        :param min_gain_dBFS: 最小增益（dBFS）
        :param max_gain_dBFS: 最大增益（dBFS）
        """
        self.min_gain_dBFS = min_gain_dBFS
        self.max_gain_dBFS = max_gain_dBFS

    def __call__(self, audio_segment):
        """应用音量扰动
        
        :param audio_segment: AudioSegment对象
        :return: 修改后的AudioSegment对象
        """
        gain_dBFS = random.uniform(self.min_gain_dBFS, self.max_gain_dBFS)
        gain_factor = 10 ** (gain_dBFS / 20.0)
        
        samples = audio_segment.samples * gain_factor
        # 防止溢出
        samples = np.clip(samples, -1.0, 1.0)
        
        return AudioSegment(samples, audio_segment.sample_rate)


class NoisePerturbAugmentor:
    """噪声扰动增强器 - 使用 torchaudio"""

    def __init__(self, noise_dir=None, max_snr_dB=10, min_snr_dB=5, **kwargs):
        """初始化噪声扰动增强器
        
        :param noise_dir: 噪声文件所在目录
        :param max_snr_dB: 最大信噪比
        :param min_snr_dB: 最小信噪比
        """
        self.noise_dir = noise_dir
        self.max_snr_dB = max_snr_dB
        self.min_snr_dB = min_snr_dB
        self.noise_files = []
        
        if noise_dir and os.path.isdir(noise_dir):
            self.noise_files = [
                os.path.join(noise_dir, f) 
                for f in os.listdir(noise_dir) 
                if f.endswith(('.wav', '.mp3', '.flac', '.ogg'))
            ]

    def __call__(self, audio_segment):
        """应用噪声扰动
        
        :param audio_segment: AudioSegment对象
        :return: 修改后的AudioSegment对象
        """
        if not self.noise_files:
            return audio_segment
        
        # 随机选择噪声文件
        noise_file = random.choice(self.noise_files)
        try:
            noise_segment = AudioSegment.from_file(noise_file)
        except Exception:
            return audio_segment
        
        # 重采样到相同的采样率
        if noise_segment.sample_rate != audio_segment.sample_rate:
            noise_segment.resample(audio_segment.sample_rate)
        
        # 如果噪声太短，重复噪声
        if len(noise_segment.samples) < len(audio_segment.samples):
            repeats = (len(audio_segment.samples) // len(noise_segment.samples)) + 1
            noise_segment.samples = np.tile(noise_segment.samples, repeats)
        
        # 随机裁剪噪声
        start = random.randint(0, len(noise_segment.samples) - len(audio_segment.samples))
        noise = noise_segment.samples[start:start + len(audio_segment.samples)]
        
        # 计算信噪比
        snr_dB = random.uniform(self.min_snr_dB, self.max_snr_dB)
        
        # 计算信号和噪声的RMS
        signal_rms = np.sqrt(np.mean(audio_segment.samples ** 2))
        noise_rms = np.sqrt(np.mean(noise ** 2))
        
        if signal_rms == 0 or noise_rms == 0:
            return audio_segment
        
        # 调整噪声幅度以达到目标SNR
        snr_linear = 10 ** (snr_dB / 20.0)
        noise_scaling = signal_rms / (snr_linear * noise_rms)
        noise = noise * noise_scaling
        
        # 混合信号和噪声
        samples = audio_segment.samples + noise
        # 防止溢出
        samples = np.clip(samples, -1.0, 1.0)
        
        return AudioSegment(samples, audio_segment.sample_rate)


class ReverbPerturbAugmentor:
    """混响扰动增强器 - 使用 torchaudio"""

    def __init__(self, reverb_dir=None, **kwargs):
        """初始化混响扰动增强器
        
        :param reverb_dir: 混响脉冲响应(RIR)文件所在目录
        """
        self.reverb_dir = reverb_dir
        self.rir_files = []
        
        if reverb_dir and os.path.isdir(reverb_dir):
            self.rir_files = [
                os.path.join(reverb_dir, f) 
                for f in os.listdir(reverb_dir) 
                if f.endswith(('.wav', '.mp3', '.flac', '.ogg'))
            ]

    def __call__(self, audio_segment):
        """应用混响扰动
        
        :param audio_segment: AudioSegment对象
        :return: 修改后的AudioSegment对象
        """
        if not self.rir_files:
            return audio_segment
        
        # 随机选择RIR文件
        rir_file = random.choice(self.rir_files)
        try:
            rir_segment = AudioSegment.from_file(rir_file)
        except Exception:
            return audio_segment
        
        # 使用 torchaudio 进行卷积（模拟混响）
        signal = torch.from_numpy(audio_segment.samples).unsqueeze(0)
        rir = torch.from_numpy(rir_segment.samples).unsqueeze(0)
        
        # torchaudio 的卷积操作
        samples = F.convolve(signal, rir)
        
        # 防止溢出
        samples = samples.squeeze(0).numpy().astype(np.float32)
        samples = np.clip(samples, -1.0, 1.0)
        
        return AudioSegment(samples, audio_segment.sample_rate)


class SpecAugmentor:
    """频谱增强器（时间掩蔽和频率掩蔽）"""

    def __init__(self, time_mask_width=40, freq_mask_width=30, **kwargs):
        """初始化频谱增强器
        
        :param time_mask_width: 时间掩蔽宽度（帧数）
        :param freq_mask_width: 频率掩蔽宽度（频率箱数）
        """
        self.time_mask_width = time_mask_width
        self.freq_mask_width = freq_mask_width

    def __call__(self, feature):
        """应用频谱增强
        
        :param feature: 特征图(numpy array, shape: [freq_bins, time_frames])
        :return: 增强后的特征图
        """
        feature = np.copy(feature)
        
        # 时间掩蔽
        if self.time_mask_width > 0 and feature.shape[1] > self.time_mask_width:
            t0 = random.randint(0, feature.shape[1] - self.time_mask_width)
            feature[:, t0:t0 + self.time_mask_width] = 0
        
        # 频率掩蔽
        if self.freq_mask_width > 0 and feature.shape[0] > self.freq_mask_width:
            f0 = random.randint(0, feature.shape[0] - self.freq_mask_width)
            feature[f0:f0 + self.freq_mask_width, :] = 0
        
        return feature
