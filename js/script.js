let dadesGlobals = null;
let meuGraficInstancia = null;
let multiplicadorEstalvi = 1.0;

// 1. 初始化与优雅降级的错误捕获
document.addEventListener('DOMContentLoaded', () => {
    fetch('data/dataclean.json')
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            dadesGlobals = data;
            calcularDades();
        })
        .catch(error => mostrarError("Sistemes fora de línia: No s'ha pogut establir connexió amb la font de dades (dataclean.json)."));
});

function mostrarError(missatge) {
    const errorDiv = document.getElementById('missatge-error');
    errorDiv.textContent = missatge;
    errorDiv.classList.remove('oculta');
}

// 2. 核心算法：逐日加权累加模型 (Model d'Acumulació Diària Ponderada)
function obtenirPesMensual(mesIndex) {
    // 权重矩阵：模拟真实的学校运营节奏 (0 = Gener, 7 = Agost)
    const pesos = [
        1.3,  // Gener (Calefacció/Exàmens)
        1.2,  // Febrer
        1.0,  // Març
        1.0,  // Abril
        1.1,  // Maig
        1.2,  // Juny (Aire condicionat)
        0.4,  // Juliol (Activitat reduïda)
        0.15, // Agost (Tancat)
        0.8,  // Setembre (Inici curs)
        1.0,  // Octubre
        1.1,  // Novembre
        1.2   // Desembre (Calefacció)
    ];
    return pesos[mesIndex];
}

function calcularDades() {
    if (!dadesGlobals) return;
    document.getElementById('missatge-error').classList.add('oculta');

    const dataInici = new Date(document.getElementById('dataInici').value);
    const dataFi = new Date(document.getElementById('dataFi').value);
    
    if (dataFi <= dataInici) {
        mostrarError("Error de lògica temporal: La data de fi ha de ser posterior a la data d'inici.");
        return;
    }

    // 提取基准日均消耗
    const baseElecDiari = dadesGlobals.electricitat[0].consum_mensual_kWh / 30;
    const baseAiguaDiari = dadesGlobals.consum_aigua[0].consum_diari_estimat_L;
    
    // 物资不按日严格算，按整体周期算更合理
    const baseOficinaMensual = dadesGlobals.material_oficina.reduce((acc, item) => acc + item.unitats_mensuals, 0);
    const baseNetejaMensual = dadesGlobals.productes_neteja.reduce((acc, item) => acc + item.unitats_mensuals, 0);

    // 变量初始化
    let elecPeriode = 0, aiguaPeriode = 0;
    let diaActual = new Date(dataInici);

    // 逐日遍历计算所选时期（核心严谨算法）
    while (diaActual <= dataFi) {
        const pes = obtenirPesMensual(diaActual.getMonth());
        elecPeriode += (baseElecDiari * pes);
        aiguaPeriode += (baseAiguaDiari * pes);
        diaActual.setDate(diaActual.getDate() + 1);
    }

    // 计算整年数据 (365天遍历，不受所选日期限制，提供恒定的基准面)
    let elecAny = 0, aiguaAny = 0;
    let diaAny = new Date(2025, 0, 1); // 以一个完整自然年测算
    for(let i = 0; i < 365; i++) {
        const pes = obtenirPesMensual(diaAny.getMonth());
        elecAny += (baseElecDiari * pes);
        aiguaAny += (baseAiguaDiari * pes);
        diaAny.setDate(diaAny.getDate() + 1);
    }

    // 粗算物资（包含小幅波动）
    const mesosDiferencia = (dataFi.getTime() - dataInici.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    const ofiPeriode = baseOficinaMensual * mesosDiferencia * 1.05;
    const ofiAny = baseOficinaMensual * 12;
    const netejaPeriode = baseNetejaMensual * mesosDiferencia;
    const netejaAny = baseNetejaMensual * 12;

    // 应用 30% 减排乘数
    const resultats = [
        elecPeriode, elecAny, aiguaPeriode, aiguaAny,
        ofiPeriode, ofiAny, netejaPeriode, netejaAny
    ].map(val => val * multiplicadorEstalvi);

    // 渲染 DOM
    document.getElementById('elec-periode').textContent = Math.round(resultats[0]).toLocaleString();
    document.getElementById('elec-any').textContent = Math.round(resultats[1]).toLocaleString();
    document.getElementById('aigua-periode').textContent = Math.round(resultats[2]).toLocaleString();
    document.getElementById('aigua-any').textContent = Math.round(resultats[3]).toLocaleString();
    document.getElementById('oficina-periode').textContent = Math.round(resultats[4]).toLocaleString();
    document.getElementById('oficina-any').textContent = Math.round(resultats[5]).toLocaleString();
    document.getElementById('neteja-periode').textContent = Math.round(resultats[6]).toLocaleString();
    document.getElementById('neteja-any').textContent = Math.round(resultats[7]).toLocaleString();

    actualitzarGrafic(resultats[1], resultats[3] / 1000, resultats[5], resultats[7]);
}

// 3. 减排触发器
function simularReduccio() {
    const btn = document.getElementById('btn-estalvi');
    multiplicadorEstalvi = 0.70;
    btn.setAttribute('aria-pressed', 'true');
    btn.textContent = "✅ Protocol Executat (Dades Recalculades)";
    btn.style.background = "var(--success)";
    calcularDades();
}

// 4. 优化后的 Chart.js 渲染 (支持颜色主题切换)
function actualitzarGrafic(elec, aigua, ofi, neteja) {
    const ctx = document.getElementById('meuGrafic').getContext('2d');
    if (meuGraficInstancia) meuGraficInstancia.destroy();

    const colors = multiplicadorEstalvi < 1.0 ? 
        ['#27ae60', '#27ae60', '#27ae60', '#27ae60'] : 
        ['#2c3e50', '#3498db', '#9b59b6', '#e74c3c'];

    meuGraficInstancia = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Electricitat (kWh)', 'Aigua (m³)', 'Material Oficina (Ut.)', 'Neteja (Ut.)'],
            datasets: [{
                label: 'Projecció de Consum Anual',
                data: [elec, aigua, ofi, neteja],
                backgroundColor: colors,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { color: '#e9ecef' } } }
        }
    });
}

// 5. 解决截断问题的 PDF 导出
function exportarPDF() {
    const element = document.getElementById('contingut-pdf');
    const opt = {
        margin:       10,
        filename:     'Auditoria_ITB.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: 'avoid-all', before: '#pla-reduccio' } // 确保减排计划不会被拦腰截断
    };
    html2pdf().set(opt).from(element).save();
}