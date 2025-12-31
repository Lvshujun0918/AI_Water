import torch

# 检查 CUDA 是否可用
print("CUDA 可用吗？", torch.cuda.is_available())  # 输出应为 True

# 查看当前 GPU 设备
print("当前 GPU 设备：", torch.cuda.current_device())

# 查看所有可用 GPU 数量
print("可用 GPU 数量：", torch.cuda.device_count())

# 创建一个张量并移动到 GPU
x = torch.tensor([1.0, 2.0])
x_gpu = x.cuda()  # 或 x.to('cuda')
print("张量是否在 GPU 上？", x_gpu.is_cuda)  # 输出应为 True

# 查看张量所在设备详情
print("张量所在设备：", x_gpu.device)  # 输出类似 'cuda:0'
