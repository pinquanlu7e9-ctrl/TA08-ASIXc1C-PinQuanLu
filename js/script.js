let dadesGlobals = null;
let meuGraficInstancia = null;
let reduccioAplicada = false;

// 1. 读取 JSON 数据
fetch('data/dataclean.json')
    .then(response => response.json())
    .then(data => {
        dadesGlobals = data;
        // 数据加载后自动执行一次计算
        calcularDades(); 
    })
    .catch(error => alert("Error carregant dataclean.json. Revisa els fitxers."));

// 2. 核心计算 (包含 8 个指标 + 季节性趋势)
function calcularDades() {
    if (!dadesGlobals) return;

    // 计算用户选择的时间段（月数）
    let dataInici = new Date(document.getElementById('dataInici').value);
    let dataFi = new Date(document.getElementById('dataFi').value);
    let mesosPeriode = (dataFi.getFullYear() - dataInici.getFullYear()) * 12 + (dataFi.getMonth() - dataInici.getMonth());
    if (mesosPeriode <= 0) mesosPeriode = 1;

    // 解析 JSON 里的真实月平均数据
    let baseElecMes = dadesGlobals.electricitat[0].consum_mensual_kWh;
    let baseAiguaMes = dadesGlobals.consum_aigua[0].consum_mensual_L;
    
    // 累加办公用品和清洁用品的数量
    let baseOficinaMes = dadesGlobals.material_oficina.reduce((total, item) => total + item.unitats_mensuals, 0);
    let baseNetejaMes = dadesGlobals.productes_neteja.reduce((total, item) => total + item.unitats_mensuals, 0);

    // 引入季节性与活动高峰波动 (Tendències Temporals)
    let factorEstacionalAny = 1.15; // 模拟全年综合波动
    let factorEstacionalPeriode = 1.05; // 模拟学期内活动高峰

    // 减排 30% 乘数
    let multiplicadorEstalvi = reduccioAplicada ? 0.70 : 1.0;

    // --- 执行 8 项计算 ---
    let elecAny = (baseElecMes * 12 * factorEstacionalAny) * multiplicadorEstalvi; 
    let elecPeriode = (baseElecMes * mesosPeriode * factorEstacionalPeriode) * multiplicadorEstalvi;

    let aiguaAny = (baseAiguaMes * 12 * factorEstacionalAny) * multiplicadorEstalvi;
    let aiguaPeriode = (baseAiguaMes * mesosPeriode * factorEstacionalPeriode) * multiplicadorEstalvi;

    let ofiAny = (baseOficinaMes * 12) * multiplicadorEstalvi;
    let ofiPeriode = (baseOficinaMes * mesosPeriode * factorEstacionalPeriode) * multiplicadorEstalvi;

    let netejaAny = (baseNetejaMes * 12) * multiplicadorEstalvi;
    let netejaPeriode = (baseNetejaMes * mesosPeriode) * multiplicadorEstalvi;

    // 更新页面上的数字展示
    document.getElementById('elec-any').innerText = Math.round(elecAny).toLocaleString();
    document.getElementById('elec-periode').innerText = Math.round(elecPeriode).toLocaleString();
    document.getElementById('aigua-any').innerText = Math.round(aiguaAny).toLocaleString();
    document.getElementById('aigua-periode').innerText = Math.round(aiguaPeriode).toLocaleString();
    document.getElementById('oficina-any').innerText = Math.round(ofiAny).toLocaleString();
    document.getElementById('oficina-periode').innerText = Math.round(ofiPeriode).toLocaleString();
    document.getElementById('neteja-any').innerText = Math.round(netejaAny).toLocaleString();
    document.getElementById('neteja-periode').innerText = Math.round(netejaPeriode).toLocaleString();

    // 更新图表 (水量除以 1000 以便图表比例协调)
    dibuixarGrafic(elecAny, aiguaAny / 1000, ofiAny, netejaAny);
}

// 3. 触发 30% 减排
function simularReduccio() {
    reduccioAplicada = true;
    calcularDades(); 
    alert("✅ Pla d'estalvi del 30% aplicat! Les dades han estat recalculades.");
}

// 4. 绘制图表
function dibuixarGrafic(elec, aigua, ofi, neteja) {
    const ctx = document.getElementById('meuGrafic').getContext('2d');
    
    // 销毁旧图表防止重叠
    if (meuGraficInstancia) meuGraficInstancia.destroy();

    meuGraficInstancia = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Electricitat (kWh)', 'Aigua (m³ / L/1000)', 'Oficina (Unitats)', 'Neteja (Unitats)'],
            datasets: [{
                label: reduccioAplicada ? 'Consum Estimat AMB Estalvi (-30%)' : 'Consum Estimat (Proper Any)',
                data: [elec, aigua, ofi, neteja],
                backgroundColor: reduccioAplicada ? ['#27ae60', '#27ae60', '#27ae60', '#27ae60'] : ['#f1c40f', '#3498db', '#9b59b6', '#1abc9c'],
            }]
        },
        options: { 
            responsive: true, 
            scales: { 
                y: { beginAtZero: true } 
            } 
        }
    });
}

// 5. 导出 PDF
function exportarPDF() {
    const element = document.getElementById('contingut-pdf');
    html2pdf().from(element).save('Calculadora_Estalvi_ITB.pdf');
}