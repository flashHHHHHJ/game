var fs = require('fs')
fs.readFile('./app.js', 'utf-8', function(err, data){ //读取文件内容
    fs.writeFile('./app.copy.js', data, function(err){ //写入新的文件内部
        if(!err){ //判断写入过程是否出错，并调用回调函数
            console.log('write file success!')
        }
    })
})