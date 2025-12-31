import sys
import json
import os
import argparse
import functools
from macls.predict import MAClsPredictor
from macls.utils.utils import add_arguments, print_arguments

def predict(spath):
    parser = argparse.ArgumentParser(description="智慧水务音频识别")
    add_arg = functools.partial(add_arguments, argparser=parser)
    add_arg('configs', str, 'F:\\个人文件\\大学文件\\开放原子RISC-V\\前后端\\whl\\AudioClassification-Pytorch\\configs\\resnet_se.yml', '配置文件')
    add_arg('use_gpu', bool, False, '是否使用GPU预测')
    add_arg('model_path', str, 'F:\\个人文件\\大学文件\\开放原子RISC-V\\前后端\\whl\\AudioClassification-Pytorch\\models\\ResNetSE_Fbank\\best_model\\model.pth', '导出的预测模型文件路径')
    args = parser.parse_args(args=[]) 

    predictor = MAClsPredictor(
        configs=args.configs,
        model_path=args.model_path,
        use_gpu=args.use_gpu,
        log_level="error"
    )
    result, score = predictor.predict(spath)
    if result == "2":
        result = "高风险"
    elif result == "1":
        result = "无风险"
    else:
        result = "低风险"

    result_j = {
        "risk_level": result,
        "confidence": score
    }
    
    # 输出结果
    print(json.dumps(result_j))
    return result

directory = 'F:\\个人文件\\大学文件\\开放原子RISC-V\\一堆数据\\新筛选数据\\aiwaternew-test'
labels = ['低风险', '无风险', '高风险']
for iteml in labels:
    dirpath = directory + '\\' + iteml
    cnt = 0
    right = 0
    print(f"--- 目录: {dirpath} ---")
    for item in os.listdir(dirpath):
        item_path = os.path.join(dirpath, item)
        if os.path.isfile(item_path):
            print(f"{item}文件:")
            cnt+=1
            s=predict(item_path)
            if s != iteml:
                print(f"分类错误，预期: {iteml}，预测: {s}")
            else:
                print(f"分类正确，类别: {s}")
                right+=1
        else:
            print(f"{item_path} 不是文件，跳过")
    print(f"目录 {dirpath} 分类正确率: {right}/{cnt} = {right/cnt:.2%}")
