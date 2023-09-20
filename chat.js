const { ipcRenderer, contextBridge, remote } = require('electron')

let currentId = null
let profile = null


/* 消息格式
msgObj = {
  id: new Date().getTime(),  时间戳作为id
  message: inputText.value, 消息内容
  type: 'txt'｜'img',  消息类型
  winId: currentId,   发送信息窗口的id
  avatar: profile.src 发送者的头像
} 
*/


const home = {
  /* 添加对话的方法 */
  addLi(msg) {
    const ul = document.querySelector('.message-box-m')
    const li = document.createElement('li')
    //获取上一条消息的时间戳
    let lastTime = ul.children.length>0 ? ul.lastElementChild.id : 0
    //计算时间戳差值
    let diff = new Date() - lastTime
    //时间戳差值转换成秒数
    const timeGap = Math.floor(diff / 1000)
    //如果大于60s则显示时间
    if (timeGap > 60) {
      li.innerHTML = `<div class="chat-time">${getCurrentTime()}</div>`
    }

    //给li添加id
    li.id = msg.id
    //根据不同的消息类型(img/text)来渲染
    switch (msg.type) {
      case 'img':
        li.innerHTML += ` 
        <div class="chat-text ">
        <img src="${msg.message}" />
      </div>
        <div class="profile">
          <img src="${msg.avatar}" alt="">
        </div>`
        break;
      default:
        li.innerHTML += `
         <div class="chat-text ">${msg.message}</div>
        <div class="profile">
          <img src="${msg.avatar}" alt="">
        </div>`
    }
    //通过当前窗口currentId和信息中winID比较，来判断发送者和接受者
    if (msg.winId == currentId) {
      //当前窗口为发送者
      li.innerHTML += ` <div class="edit">
      <span class="delete" >删除</span>
      <span class="withdraw">撤回</span>
    </div>`
      //给li添加发送者样式
      li.classList.add('chat-message', 'sender')
      msg.src = document.querySelector('.avatar-pic').src
    } else {
      //当前窗口为接收者
      li.innerHTML += ` <div class="edit">
      <span class="delete">删除</span>
      </div>`
      //给li添加接收者样式
      li.classList.add('chat-message', 'receiver')
    }
    //采用事件委托 绑定’删除‘和‘撤回’时间
    li.addEventListener('click', async (e) => {
      if (e.target.className == 'withdraw') {
        //若为撤回，则替换li内容；通知主进程删除其他窗口的信息
        li.innerHTML = `<div class="chat-withdraw">您已撤回一条消息</div>`
        ipcRenderer.send('withdraw', li.id)
      }
      if (e.target.className == 'delete') {
        //若为删除，则移除当前窗口的li
        li.remove()
      }
    })
    ul.appendChild(li)
  },

  /* 撤回对话的方法 */
  withdrawLi(id) {
    const removeItem = document.getElementById(id)
    if (removeItem) {
      removeItem.innerHTML = `<div class="chat-withdraw">对方已撤回一条消息</div>`
    }
  }
}

contextBridge.exposeInMainWorld('init', (e) => {
  //获取头像
  profile = document.querySelector('.avatar-pic')
  //获取窗口ID
  currentId = ipcRenderer.sendSync('getCurrentWinId')
  //渲染对话
  ipcRenderer.on('sending', (event, val) => {
    home.addLi(val)
  })
  //撤回对话
  ipcRenderer.on('withdrawing', (e, v) => {
    home.withdrawLi(v)
  })
})

//发送图片
contextBridge.exposeInMainWorld('choose', () => {
  const files = ipcRenderer.sendSync('choose')
  const msgObj = {
    id: new Date().getTime(),
    message: files[0],
    type: 'img',
    winId: currentId,
    avatar: profile.src
  }
  ipcRenderer.send('send', msgObj)
})

//发送消息
contextBridge.exposeInMainWorld('send', (e) => {
  const inputText = document.querySelector('textarea')
  if (inputText.value.trim() == '') return
  // 创建消息对象
  const msgObj = {
    id: new Date().getTime(),
    message: inputText.value,
    type: 'txt',
    winId: currentId,
    avatar: profile.src
  }
  inputText.value = ''
  ipcRenderer.send('send', msgObj)
})



//获取时间函数
function getCurrentTime() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}年${month}月${day}日 ${hours}:${minutes}`
}
