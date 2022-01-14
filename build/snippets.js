/**
 * 读取snippet文件下的所有json格式文件，合并导出到main-snippets.json的文件中
 */
const { readdir, stat, readFile, writeFile } = require('fs/promises');
const path = require('path');
const execSync = require('child_process').execSync;
let finalFileList = [];

// 主函数
async function main() {
  execSync('yarn ptcode');
  //  获取snippets的文件夹路径
  const snippetsPath = path.resolve(__dirname, `../snippets`);
  await getFile(snippetsPath);
  // 最后一行不需要逗号
  const finalLine = finalFileList[finalFileList.length - 1];
  finalFileList[finalFileList.length - 1] = finalLine.substring(
    0,
    finalLine.length - 1,
  );
  // 添加最外层的花括号
  finalFileList.push('}');
  finalFileList.unshift('{');
  // 写文件
  await writeMainFile(finalFileList.join('\r\n'));
  execSync('yarn ptcode');
}

// 获取每个文件的内容
async function getFile(nowPath, relativePath = './') {
  const currentPath = path.resolve(nowPath, relativePath);
  const fileStat = await stat(currentPath);
  if (fileStat.isDirectory()) {
    // 是文件夹
    const files = await readdir(currentPath);
    for (const file of files) {
      await getFile(currentPath, `./${file}`);
    }
  } else {
    // 是文件
    const signalFile = await readFile(currentPath, { encoding: 'utf8' });
    if (currentPath.indexOf('main-snippets') === -1) {
      // 不是main-snippets文件
      let lineList = signalFile.split('\r\n'); // 行拆开
      if (lineList.length < 2) {
        lineList = signalFile.split('\n');
      }
      lineList = lineList.filter((item) => item !== ''); // 空行
      lineList.pop(); // }
      lineList.shift();
      lineList[lineList.length - 1] = lineList[lineList.length - 1] + ',';
      finalFileList = finalFileList.concat(lineList);
      return true;
    }
  }
}

// 写文件
async function writeMainFile(str) {
  const mainJsonPath = path.resolve(
    __dirname,
    `../snippets/main-snippets.json`,
  );
  await writeFile(mainJsonPath, str);
}

main();
