const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron')
const path = require('path')

let win = null
let winSub = null
//主窗口
const createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            // nodeIntegration: true,
            // contextIsolation: false,
            preload: path.join(__dirname, 'chat.js')
        }
    })
    win.loadFile('home.html')

    const contextMenuTemplate = [
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { type: 'separator' },
        { label: '全选', role: 'selectall' },
    ];
    win.webContents.on('context-menu', (event, params) => {
        const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
        contextMenu.popup();
    });
}

//子窗口
const createSubWindow = () => {
    winSub = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            // nodeIntegration: true,
            // contextIsolation: false,
            preload: path.join(__dirname, 'chat.js')
        }
    })
    winSub.webContents.on('context-menu', (e, params) => {
        menu.popup()
    })
    winSub.loadFile('sub.html')
}


app.whenReady().then(() => {
    createWindow()
})

const isMac = process.platform === 'darwin'
const menuTemplate = [
    ...(isMac
        ? [{
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }]
        : []),
    {
        id: '1',
        label: '文件',
        submenu: [
            {
                label: '新建窗口',
                click() {
                    createSubWindow()
                },
                accelerator: isMac ? 'command + n' : 'ctrl + n'
            },
            {
                label: '关闭窗口',
                role: 'close'
            },
            {
                type: 'separator'
            },
            {
                label: '刷新',
                role: 'reload'
            },
            {
                label: '退出',
                role: 'quit'
            }
        ]
    },
    {
        id: '2',
        label: '编辑',
        submenu: [
            {
                label: '选择',
                type: 'radio'
            }
        ]
    },
    {
        id: '3',
        label: '帮助',
        submenu: [
            {
                label: '打开控制台',
                click(menuItem, browserWindow, event) {
                    browserWindow.toggleDevTools()
                },
                accelerator: isMac ? 'command + i' : 'ctrl + i'
            }
        ]
    }
]
const menu = Menu.buildFromTemplate(menuTemplate)
Menu.setApplicationMenu(menu)


//获取当前窗口的id
ipcMain.on('getCurrentWinId', (e, v) => {
    e.returnValue = e.sender.id
})

/* 以下是进程间通信 */
// 监听窗口自定义事件，接收渲染进程发送过来的消息

// 两个窗口通信
ipcMain.on('send', (event, val) => {
    // 获取所有窗口
    const windowList = BrowserWindow.getAllWindows()
    //给所有窗口添加对话
    windowList.forEach(item => {
        item.webContents.send('sending', val)
    })
})

//打开选择文件窗口
ipcMain.on('choose', e => {
    const win = BrowserWindow.fromId(e.frameId)
    const files = dialog.showOpenDialogSync(win, { properties: ['openFile'] })
    e.returnValue = files
})

//撤回消息
ipcMain.on('withdraw', (e, v) => {
    // 获取撤回消息窗口的id
    const sender = BrowserWindow.fromWebContents(e.sender)
    // 获取所有窗口
    const windowList = BrowserWindow.getAllWindows()
    windowList.forEach(item => {
        if (item.id !== sender.id) {
            item.webContents.send('withdrawing', v)
        }
    })
})



