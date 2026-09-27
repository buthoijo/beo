// <!--GAMFC-->version base on commit 841ed4e9ff121dde0ed6a56ae800c2e6c4f66056, time is 2024-04-16 18:02:37 UTC<!--GAMFC-END-->.
// @ts-ignore
import { connect } from 'cloudflare:sockets';
const listBugs = [
'investor.fb.com',
'help.twitter.com',
'poe.garena.com',
'www.udemy.com',
'graph.facebook.com',
'ffsupporte.poe.garena.com',
'live.iflix.com',
'io.ruangguru.com',
'data.mt',
'beta.zoom.us`,
'ava.game.naver.com',
'graph.instagram.com',
'investors.spotify.com',
'zaintest.vuclip.com',
'quiz.int.vidio.com',
'support.zoom.us',
];
const listProxy = [
{ path: '/id1', proxy: '194.58.56.169' },
{ path: '/id2', proxy: '202.10.42.30' },
{ path: '/id3', proxy: '23.47.197.73' },
{ path: '/id4', proxy: '35.219.50.99' },
{ path: '/sg1', proxy: '52.77.110.99' },
{ path: '/sg2', proxy: '167.71.214.234' },
{ path: '/sg3', proxy: '168.138.165.174' },
{ path: '/sg4', proxy: '8.219.98.13' },
{ path: '/sg5', proxy: '23.36.33.73' },
{ path: '/my1', proxy: '23.37.81.73' },
{ path: '/my2', proxy: '210.186.12.244' },
{ path: '/jp1', proxy: '52.197.230.94' },
{ path: '/jp2', proxy: '176.97.73.20' },
{ path: '/jp3', proxy: '178.236.37.45' },
{ path: '/jp4', proxy: '172.104.110.10' },
{ path: '/ge1', proxy: '212.192.31.162' },
{ path: '/ge2', proxy: '5.42.106.225' },
{ path: '/ge3', proxy: '18.192.93.64' },
{ path: '/nl1', proxy: '217.196.100.40' },
{ path: '/nl2', proxy: '2.59.183.223' },
{ path: '/nl3', proxy: '24.144.79.45' },
{ path: '/us1', proxy: '18.189.94.250' },
{ path: '/us2', proxy: '23.254.226.110' },
];
const apiCheck = 'https://api.joss-class.eu.cc/api?ip=';
let proxyIP;
let randomProxy;

async function getActiveProxy() {
  let selectedProxy;
  do {
    selectedProxy = listProxy[Math.floor(Math.random() * listProxy.length)].proxy;
    const response = await fetch('https://api.joss-class.eu.cc/api?ip=' + selectedProxy);
    const data = await response.json();
    if (data.proxyStatus === 'ACTIVE') {
      return selectedProxy;
    }
  } while (true);
}

async function updateRandomProxy() {
  randomProxy = await getActiveProxy();
}

export default {
  async fetch(request, ctx) {
    try {
      const url = new URL(request.url);
      const upgradeHeader = request.headers.get('Upgrade');
      if (url.pathname === '/') {
        const allConfig = await getAllConfigVless(request.headers.get('Host'));
        return new Response(allConfig, {
          status: 200,
          headers: { "Content-Type": "text/html;charset=utf-8" },
        });
      }
      if (upgradeHeader === 'websocket' && url.pathname === '/rotate') {
        if (!randomProxy) {
          randomProxy = await getActiveProxy();
          setInterval(updateRandomProxy, 300000);
        }
        proxyIP = randomProxy;
        return await vlessOverWSHandler(request);
      }
      for (const entry of listProxy) {
        if (url.pathname === entry.path) {
          proxyIP = entry.proxy;
          break;
        }
      }
      if (upgradeHeader === 'websocket' && proxyIP) {
        return await vlessOverWSHandler(request);
      }
      if (url.pathname === '/allstatus') {
        let results = {};
        for (const entry of listProxy) {
          const apiResponse = await fetch(apiCheck + entry.proxy);
          const apiData = await apiResponse.json();
          results[entry.path] = {
            isp: apiData.isp || null,
            country: apiData.country || null,
            proxyStatus: apiData.proxyStatus || null,
          };
        }
        return new Response(JSON.stringify(results, null, 2), {
          status: 200,
          headers: { "Content-Type": "application/json;charset=utf-8" },
        });
      }
      if (proxyIP) {
        const apiResponse = await fetch(apiCheck + proxyIP);
        const apiData = await apiResponse.json();
        const result = {
          isp: apiData.isp || null,
          country: apiData.country || null,
          proxyStatus: apiData.proxyStatus || null,
        };
        return new Response(JSON.stringify(result, null, 2), {
          status: 200,
          headers: { "Content-Type": "application/json;charset=utf-8" },
        });
      }
      return fetch(request);
    } catch (err) {
      return new Response(err.toString(), { status: 500 });
    }
  },
};

async function getAllConfigVless(hostName) {
    try {
        let vlessConfigs = '';
        let clashConfigs = '';
        for (const entry of listProxy) {
            const { path, proxy } = entry;
            const response = await fetch(`https://ipwhois.app/json/${proxy}`);
            const data = await response.json();
            const pathFixed = encodeURIComponent(path);
            const vlessTls = `vless://${generateUUIDv4()}\u0040${hostName}:443?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathFixed}#${data.isp} (${data.country_code})`;
            const vlessNtls = `vless://${generateUUIDv4()}\u0040${hostName}:80?path=${pathFixed}&security=none&encryption=none&host=${hostName}&fp=randomized&type=ws&sni=${hostName}#${data.isp} (${data.country_code})`;
            const vlessTlsFixed = vlessTls.replace(/ /g, '+');
            const vlessNtlsFixed = vlessNtls.replace(/ /g, '+');
            const clashConfTls = 
`- name: ${data.isp} (${data.country_code})
  server: ${hostName}
  port: 443
  type: vless
  uuid: ${generateUUIDv4()}
  cipher: auto
  tls: true
  udp: true
  skip-cert-verify: true
  network: ws
  servername: ${hostName}
  ws-opts:
    path: ${path}
    headers:
      Host: ${hostName}`;
             const clashConfNtls =
`- name: ${data.isp} (${data.country_code})
  server: ${hostName}
  port: 80
  type: vless
  uuid: ${generateUUIDv4()}
  cipher: auto
  tls: false
  udp: true
  skip-cert-verify: true
  network: ws
  ws-opts:
    path: ${path}
    headers:
      Host: ${hostName}`;
            clashConfigs +=
`<div style="display: none;">
   <textarea id="clashTls${path}">${clashConfTls}</textarea>
 </div>
<div style="display: none;">
   <textarea id="clashNtls${path}">${clashConfNtls}</textarea>
 </div>
<div class="config-section">
    <p><strong>ISP:</strong> ${data.isp} (${data.country_code})</p>
    <hr />
    <div class="config-toggle">
       <button class="button" onclick="fetchAndDisplayAlert('${path}')">Proxy Status</button>
        <button class="button" onclick="toggleConfig(this, 'show clash', 'hide clash')">Show Clash</button>
        <div class="config-content">
            <div class="config-block">
                <h3>TLS:</h3>
                <p class="config">${clashConfTls}</p>
                <button class="button" onclick='copyClash("clashTls${path}")'><i class="fa fa-clipboard"></i>Copy</button>
            </div>
            <hr />
            <div class="config-block">
                <h3>NTLS:</h3>
                <p class="config">${clashConfNtls}</p>
                <button class="button" onclick='copyClash("clashNtls${path}")'><i class="fa fa-clipboard"></i>Copy</button>
            </div>
        </div>
    </div>
</div>
<hr class="config-divider" />
`;
            vlessConfigs += 
`<div class="config-section">
    <p><strong>ISP:</strong> ${data.isp} (${data.country_code})</p>
    <hr />
    <div class="config-toggle">
        <button class="button" onclick="fetchAndDisplayAlert('${path}')">Proxy Status</button>
        <button class="button" onclick="toggleConfig(this, 'show vless', 'hide vless')">Show Vless</button>
        <div class="config-content">
            <div class="config-block">
                <h3>TLS:</h3>
                <p class="config">${vlessTlsFixed}</p>
                <button class="button" onclick='copyToClipboard("${vlessTlsFixed}")'><i class="fa fa-clipboard"></i>Copy</button>
            </div>
            <hr />
            <div class="config-block">
                <h3>NTLS:</h3>
                <p class="config">${vlessNtlsFixed}</p>
                <button class="button" onclick='copyToClipboard("${vlessNtlsFixed}")'><i class="fa fa-clipboard"></i>Copy</button>
            </div>
        </div>
    </div>
</div>
<hr class="config-divider" />
`;
}
              const vlessTlsRotate = `vless://${generateUUIDv4()}\u0040${hostName}:443?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=%2Frotate#ROTATE+PROXY`;
              const vlessNtlsRotate = `vless://${generateUUIDv4()}\u0040${hostName}:80?path=%2Frotate&security=none&encryption=none&host=${hostName}&fp=randomized&type=ws&sni=${hostName}#ROTATE+PROXY`;
              const clashConfTlsRotate = 
`- name: ROTATE PROXY
  server: ${hostName}
  port: 443
  type: vless
  uuid: ${generateUUIDv4()}
  cipher: auto
  tls: true
  udp: true
  skip-cert-verify: true
  network: ws
  servername: ${hostName}
  ws-opts:
    path: /rotate
    headers:
      Host: ${hostName}`;
             const clashConfNtlsRotate =
`- name: ROTATE PROXY
  server: ${hostName}
  port: 80
  type: vless
  uuid: ${generateUUIDv4()}
  cipher: auto
  tls: false
  udp: true
  skip-cert-verify: true
  network: ws
  ws-opts:
    path: /rotate
    headers:
      Host: ${hostName}`;
              let clashConfigsRotate =
`<div style="display: none;">
   <textarea id="clashTls/rotate">${clashConfTlsRotate}</textarea>
 </div>
<div style="display: none;">
   <textarea id="clashNtls/rotate">${clashConfNtlsRotate}</textarea>
 </div>
<div class="config-section">
    <p><strong>ISP:</strong> ROTATE PROXY (5min) </p>
    <hr />
    <div class="config-toggle">
        <button class="button" onclick="toggleConfig(this, 'show clash', 'hide clash')">Show Clash</button>
        <div class="config-content">
            <div class="config-block">
                <h3>TLS:</h3>
                <p class="config">${clashConfTlsRotate}</p>
                <button class="button" onclick='copyClash("clashTls/rotate")'><i class="fa fa-clipboard"></i>Copy</button>
            </div>
            <hr />
            <div class="config-block">
                <h3>NTLS:</h3>
                <p class="config">${clashConfNtlsRotate}</p>
                <button class="button" onclick='copyClash("clashNtls/rotate")'><i class="fa fa-clipboard"></i>Copy</button>
            </div>
        </div>
    </div>
</div>
<hr class="config-divider" />
`;
           let vlessConfigsRotate = 
`<div class="config-section">
    <p><strong>ISP:</strong> ROTATE PROXY (5min) </p>
    <hr />
    <div class="config-toggle">
        <button class="button" onclick="toggleConfig(this, 'show vless', 'hide vless')">Show Vless</button>
        <div class="config-content">
            <div class="config-block">
                <h3>TLS:</h3>
                <p class="config">${vlessTlsRotate}</p>
                <button class="button" onclick='copyToClipboard("${vlessTlsRotate}")'><i class="fa fa-clipboard"></i>Copy</button>
            </div>
            <hr />
            <div class="config-block">
                <h3>NTLS:</h3>
                <p class="config">${vlessNtlsRotate}</p>
                <button class="button" onclick='copyToClipboard("${vlessNtlsRotate}")'><i class="fa fa-clipboard"></i>Copy</button>
            </div>
        </div>
    </div>
</div>
<hr class="config-divider" />
`;
        let bugList = listBugs.map((bug, index) => `<li><span class="domain-number">${index + 1}</span> ${bug} <button class="button" onclick='copyToClipboard("${bug}")'><i class="fa fa-clipboard"></i>Copy</button></li>`).join('');

        const htmlConfigs = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VLESS | KERKUI</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" integrity="sha512-Fo3rlrZj/k7ujTnHg4C+6PCWJ+8zzHcXQjXGp6n5Yh9rX0x5fOdPaOqO+e2X4R5C1aE/BSqPIG+8y3O6APa8w==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap');

        body {
            margin: 0;
            padding: 0;
            font-family: 'Poppins', sans-serif;
            background: url('https://telegra.ph/file/0b9a4c97f231c8bc33aa9.jpg') no-repeat center center fixed;
            background-size: cover;
            color: #f5f5f5;
            display: flex;
            align-items: center;
            flex-direction: column;
            min-height: 100vh;
            overflow: hidden;
        }

        .container {
            max-width: 1200px;
            width: 80%;
            margin-top: 50px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            animation: fadeIn 1s ease-in-out;
            overflow-y: auto;
            max-height: 80vh;
        }

        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 15, 15, 0.4);
            z-index: -1;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
        }

        .header h1 {
            font-size: 42px;
            color: #00a8ff;
            margin: 0;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 4px;
        }

        .nav-buttons {
            display: flex;
            justify-content: center;
            margin-bottom: 30px;
            gap: 20px;
        }

        .nav-buttons .button {
            background-color: transparent;
            border: 2px solid #00a8ff;
            color: #00a8ff;
            padding: 6px 12px;
            font-size: 10px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .nav-buttons .button:hover {
            background-color: #00a8ff;
            color: #fff;
            transform: scale(1.05);
        }

        .content {
            display: none;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        }

        .content.active {
            display: block;
            opacity: 1;
        }

        .config-section {
            background: rgba(255, 255, 255, 0.1);
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 20px;
            position: relative;
            animation: slideIn 0.5s ease-in-out;
        }

        @keyframes slideIn {
            from { transform: translateX(-30px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        .config-section h3 {
            margin-top: 0;
            color: #e1b12c;
            font-size: 28px;
        }

        .config-section p {
            color: #f5f5f5;
            font-size: 16px;
        }

        .config-toggle {
            margin-bottom: 20px;
        }

        .config-content {
            display: none;
        }

        .config-content.active {
            display: block;
        }

        .config-block {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 10px;
            background-color: rgba(0, 0, 0, 0.2);
            transition: background-color 0.3s ease;
        }

        .config-block h4 {
            margin-bottom: 8px;
            color: #f39c12;
            font-size: 22px;
            font-weight: 600;
        }

        .config {
            background-color: rgba(0, 0, 0, 0.2);
            padding: 15px;
            border-radius: 5px;
            border: 2px solid #00a8ff;
            color: #f5f5f5;
            word-wrap: break-word;
            white-space: pre-wrap;
            font-family: 'Courier New', Courier, monospace;
            font-size: 15px;
        }
        .button {
            background-color: transparent;
            border: 2px solid #00a8ff;
            color: #00a8ff;
            padding: 4px 8px;
            font-size: 8px;
            border-radius: 3px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-right: 4px;
        }

        .button i {
            margin-right: 3px;
        }

        .button:hover {
            background-color: #00a8ff;
            color: #fff;
            transform: scale(1.0);
        }

        .config-divider {
            border: none;
            height: 1px;
            background: linear-gradient(to right, transparent, #fff, transparent);
            margin: 40px 0;
        }
        .watermark {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.5);
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
            font-weight: bold;
            text-align: center;
        }
        .watermark a {
            color: #ffa500;
            text-decoration: none;
            font-weight: bold;
        }
        .watermark a:hover {
            color: #ffa500;
        }
        .domain-list {
            color: #f5f5f5;
            font-size: 10px;
            list-style: none;
            padding-left: 0;
            animation: slideIn 0.5s ease-in-out;
        }

        .domain-list li {
            background: rgba(255, 255, 255, 0.1);
            padding: 6px 12px;
            border-radius: 6px;
            margin-bottom: 8px;
            position: relative;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: transform 0.3s ease;
        }

        .domain-list li:hover {
            transform: translateX(8px);
        }

        .domain-list li::before {
            font-family: "Font Awesome 5 Free";
            font-weight: 650;
            position: absolute;
            left: -25px;
            top: 50%;
            transform: translateY(-50%);
            color: #00a8ff;
        }

        .domain-number {
            font-weight: bold;
            color: #00a8ff;
            margin-right: 10px;
        }

        @media (max-width: 768px) {
            .header h1 {
                font-size: 32px;
            }

            .config-section h3 {
                font-size: 24px;
            }

            .config-block h4 {
                font-size: 20px;
            }

            .domain-list {
                font-size: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="overlay"></div>
    <div class="container">
        <div class="header">
            <h1>VLESS CLOUDFLARE</h1>
        </div>
        <div class="nav-buttons">
            <button class="button" onclick="showContent('vless')">List vless</button>
            <button class="button" onclick="showContent('clash')">List Clash</button>
            <button class="button" onclick="showContent('domains')">List wildcard</button>
        </div>
        <div id="vless" class="content active">
            ${vlessConfigs}
            ${vlessConfigsRotate}
        </div>
        <div id="clash" class="content">
            ${clashConfigs}
            ${clashConfigsRotate}
        </div>
        <div id="domains" class="content">
            <ul class="domain-list">
                ${bugList}
            </ul>
        </div>
    </div>
    <div class="watermark">© <a href="https://t.me/cfvless" target="_blank">vless gratis</a></div>

    <script>
        function showContent(contentId) {
            const contents = document.querySelectorAll('.content');
            contents.forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(contentId).classList.add('active');
        }
        function salinTeks() {
            var teks = document.getElementById('teksAsli');
            teks.select();
            document.execCommand('copy');
            alert('Teks telah disalin.');
        }
        function copyClash(elementId) {
            const text = document.getElementById(elementId).textContent;
            navigator.clipboard.writeText(text)
            .then(() => {
            const alertBox = document.createElement('div');
            alertBox.textContent = "Copied to clipboard!";
            alertBox.style.position = 'fixed';
            alertBox.style.bottom = '20px';
            alertBox.style.right = '20px';
            alertBox.style.backgroundColor = '#00a8ff';
            alertBox.style.color = '#fff';
            alertBox.style.padding = '10px 20px';
            alertBox.style.borderRadius = '5px';
            alertBox.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            alertBox.style.opacity = '0';
            alertBox.style.transition = 'opacity 0.5s ease-in-out';
            document.body.appendChild(alertBox);
            setTimeout(() => {
                alertBox.style.opacity = '1';
            }, 100);
            setTimeout(() => {
                alertBox.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(alertBox);
                }, 500);
            }, 2000);
        })
        .catch((err) => {
            console.error("Failed to copy to clipboard:", err);
        });
        }
function fetchAndDisplayAlert(path) {
    fetch(path)
        .then(response => {
            if (!response.ok) {
                throw new Error(\`HTTP error! Status: \${response.status}\`);
            }
            return response.json();
        })
        .then(data => {
            const proxyStatus = data.proxyStatus || "Unknown status";
            const alertBox = document.createElement('div');
            alertBox.textContent = \`Proxy Status: \${proxyStatus}\`;
            alertBox.style.position = 'fixed';
            alertBox.style.bottom = '20px';
            alertBox.style.right = '20px';
            alertBox.style.backgroundColor = '#00a8ff';
            alertBox.style.color = '#fff';
            alertBox.style.padding = '10px 20px';
            alertBox.style.borderRadius = '5px';
            alertBox.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            alertBox.style.opacity = '0';
            alertBox.style.transition = 'opacity 0.5s ease-in-out';
            document.body.appendChild(alertBox);
            
            setTimeout(() => {
                alertBox.style.opacity = '1';
            }, 100);
            
            setTimeout(() => {
                alertBox.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(alertBox);
                }, 500);
            }, 2000);
        })
        .catch((err) => {
            alert("Failed to fetch data or invalid response.");
        });
}
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    const alertBox = document.createElement('div');
                    alertBox.textContent = "Copied to clipboard!";
                    alertBox.style.position = 'fixed';
                    alertBox.style.bottom = '20px';
                    alertBox.style.right = '20px';
                    alertBox.style.backgroundColor = '#00a8ff';
                    alertBox.style.color = '#fff';
                    alertBox.style.padding = '10px 20px';
                    alertBox.style.borderRadius = '5px';
                    alertBox.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    alertBox.style.opacity = '0';
                    alertBox.style.transition = 'opacity 0.5s ease-in-out';
                    document.body.appendChild(alertBox);
                    setTimeout(() => {
                        alertBox.style.opacity = '1';
                    }, 100);
                    setTimeout(() => {
                        alertBox.style.opacity = '0';
                        setTimeout(() => {
                            document.body.removeChild(alertBox);
                        }, 500);
                    }, 2000);
                })
                .catch((err) => {
                    console.error("Failed to copy to clipboard:", err);
                });
        }

        function toggleConfig(button, show, hide) {
            const configContent = button.nextElementSibling;
            if (configContent.classList.contains('active')) {
                configContent.classList.remove('active');
                button.textContent = show;
            } else {
                configContent.classList.add('active');
                button.textContent = hide;
            }
        }
    </script>
</body>
</html>`;
        return htmlConfigs;
    } catch (error) {
        return `An error occurred while generating the VLESS configurations. ${error}`;
    }
}
function generateUUIDv4() {
  const randomValues = crypto.getRandomValues(new Uint8Array(16));
  randomValues[6] = (randomValues[6] & 0x0f) | 0x40;
  randomValues[8] = (randomValues[8] & 0x3f) | 0x80;
  return [
    randomValues[0].toString(16).padStart(2, '0'),
    randomValues[1].toString(16).padStart(2, '0'),
    randomValues[2].toString(16).padStart(2, '0'),
    randomValues[3].toString(16).padStart(2, '0'),
    randomValues[4].toString(16).padStart(2, '0'),
    randomValues[5].toString(16).padStart(2, '0'),
    randomValues[6].toString(16).padStart(2, '0'),
    randomValues[7].toString(16).padStart(2, '0'),
    randomValues[8].toString(16).padStart(2, '0'),
    randomValues[9].toString(16).padStart(2, '0'),
    randomValues[10].toString(16).padStart(2, '0'),
    randomValues[11].toString(16).padStart(2, '0'),
    randomValues[12].toString(16).padStart(2, '0'),
    randomValues[13].toString(16).padStart(2, '0'),
    randomValues[14].toString(16).padStart(2, '0'),
    randomValues[15].toString(16).padStart(2, '0'),
  ].join('').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}
async function vlessOverWSHandler(request) {
	const webSocketPair = new WebSocketPair();
	const [client, webSocket] = Object.values(webSocketPair);

	webSocket.accept();

	let address = '';
	let portWithRandomLog = '';
	const log = (info, event) => {
		console.log(`[${address}:${portWithRandomLog}] ${info}`, event || '');
	};
	const earlyDataHeader = request.headers.get('sec-websocket-protocol') || '';

	const readableWebSocketStream = makeReadableWebSocketStream(webSocket, earlyDataHeader, log);

	let remoteSocketWapper = {
		value: null,
	};
	let udpStreamWrite = null;
	let isDns = false;

	readableWebSocketStream.pipeTo(new WritableStream({
		async write(chunk, controller) {
			if (isDns && udpStreamWrite) {
				return udpStreamWrite(chunk);
			}
			if (remoteSocketWapper.value) {
				const writer = remoteSocketWapper.value.writable.getWriter()
				await writer.write(chunk);
				writer.releaseLock();
				return;
			}

			const {
				hasError,
				message,
				portRemote = 443,
				addressRemote = '',
				rawDataIndex,
				vlessVersion = new Uint8Array([0, 0]),
				isUDP,
			} = processVlessHeader(chunk);
			address = addressRemote;
			portWithRandomLog = `${portRemote}--${Math.random()} ${isUDP ? 'udp ' : 'tcp '
				} `;
			if (hasError) {
				throw new Error(message); 
				return;
			}
			if (isUDP) {
				if (portRemote === 53) {
					isDns = true;
				} else {
					throw new Error('UDP proxy only enable for DNS which is port 53');
					return;
				}
			}
			const vlessResponseHeader = new Uint8Array([vlessVersion[0], 0]);
			const rawClientData = chunk.slice(rawDataIndex);

			if (isDns) {
				const { write } = await handleUDPOutBound(webSocket, vlessResponseHeader, log);
				udpStreamWrite = write;
				udpStreamWrite(rawClientData);
				return;
			}
			handleTCPOutBound(remoteSocketWapper, addressRemote, portRemote, rawClientData, webSocket, vlessResponseHeader, log);
		},
		close() {
			log(`readableWebSocketStream is close`);
		},
		abort(reason) {
			log(`readableWebSocketStream is abort`, JSON.stringify(reason));
		},
	})).catch((err) => {
		log('readableWebSocketStream pipeTo error', err);
	});

	return new Response(null, {
		status: 101,
		webSocket: client,
	});
}

async function handleTCPOutBound(remoteSocket, addressRemote, portRemote, rawClientData, webSocket, vlessResponseHeader, log,) {
	async function connectAndWrite(address, port) {
		const tcpSocket = connect({
			hostname: address,
			port: port,
		});
		remoteSocket.value = tcpSocket;
		log(`connected to ${address}:${port}`);
		const writer = tcpSocket.writable.getWriter();
		await writer.write(rawClientData);
		writer.releaseLock();
		return tcpSocket;
	}

	async function retry() {
		const tcpSocket = await connectAndWrite(proxyIP || addressRemote, portRemote)
		tcpSocket.closed.catch(error => {
			console.log('retry tcpSocket closed error', error);
		}).finally(() => {
			safeCloseWebSocket(webSocket);
		})
		remoteSocketToWS(tcpSocket, webSocket, vlessResponseHeader, null, log);
	}

	const tcpSocket = await connectAndWrite(addressRemote, portRemote);

	remoteSocketToWS(tcpSocket, webSocket, vlessResponseHeader, retry, log);
}

function makeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
	let readableStreamCancel = false;
	const stream = new ReadableStream({
		start(controller) {
			webSocketServer.addEventListener('message', (event) => {
				if (readableStreamCancel) {
					return;
				}
				const message = event.data;
				controller.enqueue(message);
			});
			webSocketServer.addEventListener('close', () => {
				safeCloseWebSocket(webSocketServer);
				if (readableStreamCancel) {
					return;
				}
				controller.close();
			}
			);
			webSocketServer.addEventListener('error', (err) => {
				log('webSocketServer has error');
				controller.error(err);
			}
			);
			const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
			if (error) {
				controller.error(error);
			} else if (earlyData) {
				controller.enqueue(earlyData);
			}
		},

		pull(controller) {
		},
		cancel(reason) {
			if (readableStreamCancel) {
				return;
			}
			log(`ReadableStream was canceled, due to ${reason}`)
			readableStreamCancel = true;
			safeCloseWebSocket(webSocketServer);
		}
	});

	return stream;

}
function processVlessHeader(
	vlessBuffer
) {
	if (vlessBuffer.byteLength < 24) {
		return {
			hasError: true,
			message: 'invalid data',
		};
	}
	const version = new Uint8Array(vlessBuffer.slice(0, 1));
	let isValidUser = true;
	let isUDP = false;
	if (!isValidUser) {
		return {
			hasError: true,
			message: 'invalid user',
		};
	}

	const optLength = new Uint8Array(vlessBuffer.slice(17, 18))[0];

	const command = new Uint8Array(
		vlessBuffer.slice(18 + optLength, 18 + optLength + 1)
	)[0];
	if (command === 1) {
	} else if (command === 2) {
		isUDP = true;
	} else {
		return {
			hasError: true,
			message: `command ${command} is not support, command 01-tcp,02-udp,03-mux`,
		};
	}
	const portIndex = 18 + optLength + 1;
	const portBuffer = vlessBuffer.slice(portIndex, portIndex + 2);
	const portRemote = new DataView(portBuffer).getUint16(0);

	let addressIndex = portIndex + 2;
	const addressBuffer = new Uint8Array(
		vlessBuffer.slice(addressIndex, addressIndex + 1)
	);

	const addressType = addressBuffer[0];
	let addressLength = 0;
	let addressValueIndex = addressIndex + 1;
	let addressValue = '';
	switch (addressType) {
		case 1:
			addressLength = 4;
			addressValue = new Uint8Array(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
			).join('.');
			break;
		case 2:
			addressLength = new Uint8Array(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + 1)
			)[0];
			addressValueIndex += 1;
			addressValue = new TextDecoder().decode(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
			);
			break;
		case 3:
			addressLength = 16;
			const dataView = new DataView(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
			);
			const ipv6 = [];
			for (let i = 0; i < 8; i++) {
				ipv6.push(dataView.getUint16(i * 2).toString(16));
			}
			addressValue = ipv6.join(':');
			break;
		default:
			return {
				hasError: true,
				message: `invild  addressType is ${addressType}`,
			};
	}
	if (!addressValue) {
		return {
			hasError: true,
			message: `addressValue is empty, addressType is ${addressType}`,
		};
	}

	return {
		hasError: false,
		addressRemote: addressValue,
		addressType,
		portRemote,
		rawDataIndex: addressValueIndex + addressLength,
		vlessVersion: version,
		isUDP,
	};
}

async function remoteSocketToWS(remoteSocket, webSocket, vlessResponseHeader, retry, log) {
	let remoteChunkCount = 0;
	let chunks = [];
	let vlessHeader = vlessResponseHeader;
	let hasIncomingData = false;
	await remoteSocket.readable
		.pipeTo(
			new WritableStream({
				start() {
				},
				async write(chunk, controller) {
					hasIncomingData = true;
					if (webSocket.readyState !== WS_READY_STATE_OPEN) {
						controller.error(
							'webSocket.readyState is not open, maybe close'
						);
					}
					if (vlessHeader) {
						webSocket.send(await new Blob([vlessHeader, chunk]).arrayBuffer());
						vlessHeader = null;
					} else {
						webSocket.send(chunk);
					}
				},
				close() {
					log(`remoteConnection!.readable is close with hasIncomingData is ${hasIncomingData}`);
				},
				abort(reason) {
					console.error(`remoteConnection!.readable abort`, reason);
				},
			})
		)
		.catch((error) => {
			console.error(
				`remoteSocketToWS has exception `,
				error.stack || error
			);
			safeCloseWebSocket(webSocket);
		});
	if (hasIncomingData === false && retry) {
		log(`retry`)
		retry();
	}
}

function base64ToArrayBuffer(base64Str) {
	if (!base64Str) {
		return { error: null };
	}
	try {
		base64Str = base64Str.replace(/-/g, '+').replace(/_/g, '/');
		const decode = atob(base64Str);
		const arryBuffer = Uint8Array.from(decode, (c) => c.charCodeAt(0));
		return { earlyData: arryBuffer.buffer, error: null };
	} catch (error) {
		return { error };
	}
}


const WS_READY_STATE_OPEN = 1;
const WS_READY_STATE_CLOSING = 2;
function safeCloseWebSocket(socket) {
	try {
		if (socket.readyState === WS_READY_STATE_OPEN || socket.readyState === WS_READY_STATE_CLOSING) {
			socket.close();
		}
	} catch (error) {
		console.error('safeCloseWebSocket error', error);
	}
}

async function handleUDPOutBound(webSocket, vlessResponseHeader, log) {

	let isVlessHeaderSent = false;
	const transformStream = new TransformStream({
		start(controller) {

		},
		transform(chunk, controller) {
			for (let index = 0; index < chunk.byteLength;) {
				const lengthBuffer = chunk.slice(index, index + 2);
				const udpPakcetLength = new DataView(lengthBuffer).getUint16(0);
				const udpData = new Uint8Array(
					chunk.slice(index + 2, index + 2 + udpPakcetLength)
				);
				index = index + 2 + udpPakcetLength;
				controller.enqueue(udpData);
			}
		},
		flush(controller) {
		}
	});
	transformStream.readable.pipeTo(new WritableStream({
		async write(chunk) {
			const resp = await fetch('https://1.1.1.1/dns-query',
				{
					method: 'POST',
					headers: {
						'content-type': 'application/dns-message',
					},
					body: chunk,
				})
			const dnsQueryResult = await resp.arrayBuffer();
			const udpSize = dnsQueryResult.byteLength;
			const udpSizeBuffer = new Uint8Array([(udpSize >> 8) & 0xff, udpSize & 0xff]);
			if (webSocket.readyState === WS_READY_STATE_OPEN) {
				log(`doh success and dns message length is ${udpSize}`);
				if (isVlessHeaderSent) {
					webSocket.send(await new Blob([udpSizeBuffer, dnsQueryResult]).arrayBuffer());
				} else {
					webSocket.send(await new Blob([vlessResponseHeader, udpSizeBuffer, dnsQueryResult]).arrayBuffer());
					isVlessHeaderSent = true;
				}
			}
		}
	})).catch((error) => {
		log('dns udp has error' + error)
	});

	const writer = transformStream.writable.getWriter();

	return {
		write(chunk) {
			writer.write(chunk);
		}
	};
}
