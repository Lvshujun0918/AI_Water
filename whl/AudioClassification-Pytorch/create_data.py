import os

directory = 'F:\\个人文件\\大学文件\\开放原子RISC-V\\一堆数据\\新筛选数据\\aiwaternew'
directory_t = 'F:\\个人文件\\大学文件\\开放原子RISC-V\\一堆数据\\新筛选数据\\aiwaternew-test'
list_path = 'F:\\个人文件\\大学文件\\开放原子RISC-V\\前后端\\whl\\AudioClassification-Pytorch\\model'
labels = {'0':'低风险', '1':'无风险', '2':'高风险'}
for num, iteml in labels.items():
    dirpath = directory + '\\' + iteml
    cnt = 0
    right = 0
    f_label = open(os.path.join(list_path, 'label_list.txt'), 'a', encoding='utf-8')
    f_label.write(f'{num}\n')
    print(f"--- 目录: {dirpath} ---")
    for item in os.listdir(dirpath):
        item_path = os.path.join(dirpath, item)
        if os.path.isfile(item_path):
            f_train = open(os.path.join(list_path, 'train_list.txt'), 'a', encoding='utf-8')
            f_train.write(f'{item_path}\t{num}\n')
            f_train.close()
        else:
            print(f"{item_path} 不是文件，跳过")
    f_label.close()


for num, iteml in labels.items():
    dirpath = directory_t + '\\' + iteml
    cnt = 0
    right = 0
    print(f"--- 目录: {dirpath} ---")
    for item in os.listdir(dirpath):
        item_path = os.path.join(dirpath, item)
        if os.path.isfile(item_path):
            f_train = open(os.path.join(list_path, 'test_list.txt'), 'a', encoding='utf-8')
            f_train.write(f'{item_path}\t{num}\n')
            f_train.close()
        else:
            print(f"{item_path} 不是文件，跳过")