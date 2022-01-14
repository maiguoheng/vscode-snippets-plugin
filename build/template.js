/**
 * 读取template文件夹下的所有文件，并打包输出成为同名snippets文件
 */
const { readdir, stat, readFile, writeFile } = require('fs/promises');
const path = require('path');
const execSync = require('child_process').execSync;

// 主函数
async function main() {
  execSync('yarn ptcode');
  //  获取templatesPath的文件夹路径
  const templatesPath = path.resolve(__dirname, `../template`);
  const dirs = await readdir(templatesPath);
  for (const dir of dirs) {
    await handleSignalDir(dir);
  }
  execSync('yarn ptcode');
}

// 处理单个文件夹
async function handleSignalDir(dir) {
  // 当前文件夹的目录
  const dirPath = path.resolve(__dirname, `../template/${dir}`);
  const files = await readdir(dirPath);
  const indexFilePath = path.resolve(__dirname, `../template/${dir}/index.js`);
  const describeFile = require(indexFilePath); // index文件
  for (const key in describeFile) {
    // 对所有index文件定义的对象进行解析赋值
    if (Object.hasOwnProperty.call(describeFile, key)) {
      for (const signalFile of files) {
        // 单个文件
        if (signalFile.indexOf(key) !== -1) {
          const fileDescObj = describeFile[key];
          await handleSignalFile(dirPath, signalFile, fileDescObj, key);
        }
      }
    }
  }
  return true;
}

// 处理单个文件
async function handleSignalFile(dirPath, name, fileDescObj, key) {
  const filePath = path.resolve(dirPath, `./${name}`);
  const fileStat = await stat(filePath);
  if (fileStat.isFile()) {
    // 是文件
    const signalFile = await readFile(filePath, { encoding: 'utf8' });
    let lineList = signalFile.split('\r\n'); // 行拆开
    if (lineList.length < 2) {
      lineList = signalFile.split('\n');
    }
    lineList = lineList.filter((item) => item !== ''); // 空行
    const result = {
      [key]: {
        prefix: fileDescObj['prefix'],
        body: lineList,
        description: fileDescObj['description']
      },
    };
    await writeSignalFile(JSON.stringify(result), filePath);
  }
  return true;
}

// 写文件
async function writeSignalFile(str, filePath) {
  let outputPath = filePath.replace('template', 'snippets');
  outputPath = `${outputPath.substring(0, outputPath.lastIndexOf('.'))}.json`;
  await writeFile(outputPath, str);
  return true;
}

main();
