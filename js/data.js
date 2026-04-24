/*
  Dades base de la Fase 3.
  Les sèries són mensuals i estan pensades per construir una calculadora útil.
  Criteri local: calendari lectiu de Barcelona, activitat baixa al juliol/agost,
  electricitat més alta en mesos freds i aigua més sensible a temperatura i ocupació.
*/

const TA08_DATA = {
  project: {
    name: "TA08-ASIXc1C-PinQuanLu",
    group: "ASIXc1C",
    author: "PinQuanLu",
    question: "Podem reduir un 30% l'impacte ambiental del centre en 3 anys?"
  },

  months: [
    "2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06",
    "2024-07", "2024-08", "2024-09", "2024-10", "2024-11", "2024-12"
  ],

  monthNames: {
    "01": "Gener", "02": "Febrer", "03": "Març", "04": "Abril",
    "05": "Maig", "06": "Juny", "07": "Juliol", "08": "Agost",
    "09": "Setembre", "10": "Octubre", "11": "Novembre", "12": "Desembre"
  },

  indicators: {
    electricitat: {
      label: "Electricitat",
      shortLabel: "Electricitat",
      icon: "⚡",
      unit: "kWh",
      costUnit: "€/kWh",
      cost: 0.18,
      emissionFactor: 0.126,
      emissionUnit: "kg CO₂/kWh",
      annualTrend: 0.025,
      reductionTarget: 0.32,
      reliability: "Alta-mitjana",
      source: "Plant Report_ITB_01-2025.xlsx + normalització mensual",
      description: "Consum elèctric estimat del centre, calibrat amb el report fotovoltaic i adaptat al calendari lectiu.",
      values: [9860, 8700, 7600, 6900, 6400, 6200, 4100, 3800, 7400, 8300, 9100, 9600],
      actions: [
        "Configurar suspensió automàtica dels ordinadors després de 10 minuts sense ús.",
        "Apagar projectors, pantalles i equips de xarxa no essencials fora de l'horari lectiu.",
        "Prioritzar equips eficients i revisar el consum en standby de les aules TIC.",
        "Aprofitar millor la producció fotovoltaica en hores de màxima generació."
      ],
      kpi: "kWh mensuals i kg CO₂ equivalent",
      circularity: "Allargar la vida útil d'equips i prioritzar reparació abans de substitució."
    },

    aigua: {
      label: "Aigua",
      shortLabel: "Aigua",
      icon: "💧",
      unit: "L",
      costUnit: "€/m³",
      cost: 0.0025,
      emissionFactor: 0.00030,
      emissionUnit: "kg CO₂/L",
      annualTrend: 0.018,
      reductionTarget: 0.30,
      reliability: "Mitjana",
      source: "Aigua-image001/002/003.png + extrapolació mensual",
      description: "Consum d'aigua estimat a partir de captures horàries i variació per activitat escolar i temperatura.",
      values: [118000, 122000, 116000, 126000, 139000, 151000, 82000, 58000, 132000, 146000, 154000, 138000],
      actions: [
        "Instal·lar reductors de cabal i revisar aixetes amb fuites.",
        "Fer seguiment mensual de lectures per detectar consums anòmals.",
        "Col·locar cartells d'ús responsable a lavabos i zones comunes.",
        "Prioritzar sistemes de neteja que consumeixin menys aigua."
      ],
      kpi: "Litres mensuals, cost i desviacions anòmales",
      circularity: "Reduir consum de recursos i reutilitzar aigua quan sigui viable en tasques no crítiques."
    },

    material_oficina: {
      label: "Consumibles d'oficina",
      shortLabel: "Oficina",
      icon: "📄",
      unit: "u.",
      costUnit: "€/unitat",
      cost: 0.12,
      emissionFactor: 0.045,
      emissionUnit: "kg CO₂/unitat",
      annualTrend: 0.022,
      reductionTarget: 0.34,
      reliability: "Mitjana-baixa",
      source: "F035, F036, F327, F328 + distribució per calendari lectiu",
      description: "Paper, retoladors, recanvis de pissarra i altres materials fungibles utilitzats al centre.",
      values: [820, 900, 980, 940, 860, 780, 320, 260, 1180, 1260, 1320, 980],
      actions: [
        "Digitalitzar comunicacions internes i evitar impressions no necessàries.",
        "Reutilitzar carpetes, fundes i material en bon estat.",
        "Comprar paper reciclat i retoladors recarregables.",
        "Centralitzar el control d'estoc per reduir compres duplicades."
      ],
      kpi: "Unitats mensuals i percentatge de material reutilitzat",
      circularity: "Compra reciclada, reutilització i recàrrega de material fungible."
    },

    productes_neteja: {
      label: "Productes de neteja",
      shortLabel: "Neteja",
      icon: "🧼",
      unit: "u.",
      costUnit: "€/unitat",
      cost: 3.80,
      emissionFactor: 0.70,
      emissionUnit: "kg CO₂/unitat",
      annualTrend: 0.016,
      reductionTarget: 0.28,
      reliability: "Mitjana-baixa",
      source: "F055-Neteges.png, F056-Neteges.png + estimació mensual",
      description: "Productes de neteja i higiene amb variació segons ús d'espais, calendari lectiu i protocols de manteniment.",
      values: [145, 150, 158, 162, 160, 155, 95, 88, 175, 182, 190, 170],
      actions: [
        "Comprar productes concentrats o a granel per reduir envasos.",
        "Substituir productes agressius per alternatives ecoetiquetades.",
        "Dosificar correctament els productes per evitar sobreconsum.",
        "Reutilitzar envasos quan el proveïdor ofereixi recàrregues."
      ],
      kpi: "Unitats mensuals, cost i percentatge de producte ecoetiquetat",
      circularity: "Compra a granel, envasos retornables i reducció de residus."
    }
  },

  reductionPlan: [
    {
      year: "Any 1",
      target: 10,
      title: "Mesura i control",
      description: "Auditoria inicial, configuració d'estalvi energètic als equips TIC, seguiment mensual de consums i compra responsable.",
      kpis: ["Lectures mensuals", "Equips configurats", "Compres centralitzades"]
    },
    {
      year: "Any 2",
      target: 21,
      title: "Optimització",
      description: "Renovació progressiva d'equips, reducció d'impressions, temporitzadors i revisió de contractes de subministrament.",
      kpis: ["kWh per aula", "Litres per dia lectiu", "% paper reciclat"]
    },
    {
      year: "Any 3",
      target: 30,
      title: "Economia circular",
      description: "Protocol de segona vida d'equips, reutilització de materials, compra verda i consolidació d'hàbits sostenibles.",
      kpis: ["Equips reutilitzats", "Envasos reduïts", "Estalvi acumulat"]
    }
  ]
};
