import sys
import json
import os
import argparse
import functools
from macls.predict import MAClsPredictor
from macls.utils.utils import add_arguments, print_arguments

def main():
    # 获取参数
    file_path = sys.argv[1]
    dir_path = sys.argv[2]
    model_path = dir_path+"/model/"
    
    parser = argparse.ArgumentParser(description="智慧水务音频识别")
    add_arg = functools.partial(add_arguments, argparser=parser)
    add_arg('configs', str, dir_path+'/config/resnet_se.yml', '配置文件')
    add_arg('use_gpu', bool, False, '是否使用GPU预测')
    add_arg('model_path', str, model_path, '导出的预测模型文件路径')
    args = parser.parse_args(args=[]) 

    predictor = MAClsPredictor(
        configs=args.configs,
        model_path=args.model_path,
        use_gpu=args.use_gpu,
        log_level="error"
    )
    result, score = predictor.predict(file_path)
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

main()