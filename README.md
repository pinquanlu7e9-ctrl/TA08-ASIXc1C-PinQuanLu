# TA08-ASIXc1C-PinQuanLu

## Calculadora d'estalvi energètic

Projecte de la Fase 3 del repte **TA08 - Calculadora d'estalvi energètic**.

La web calcula i visualitza l'impacte de quatre indicadors:

1. Electricitat
2. Aigua
3. Consumibles d'oficina
4. Productes de neteja

## Funcionalitats

- 8 càlculs obligatoris: pròxim any i període setembre-juny per cada indicador.
- Selector de mesos en català.
- Botó `Calcular` amb actualització real dels resultats.
- Gràfics interactius en Canvas.
- Simulador d'escenari de reducció entre el 20% i el 40%.
- Pla de reducció del 30% a 3 anys.
- Recalcul abans/després.
- Exportació a PDF amb la funció d'impressió del navegador.
- Estructura separada HTML, CSS, JavaScript, dades i recursos.

## Estructura

```text
TA08-ASIXc1C-PinQuanLu/
├── index.html
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── data.js
│   ├── calculations.js
│   └── app.js
├── data/
│   └── dataclean.json
└── assets/
    └── img/
        └── README.txt
```

## Com executar el projecte

1. Obrir la carpeta amb Visual Studio Code.
2. Instal·lar l'extensió **Live Server**.
3. Obrir `index.html`.
4. Clic dret → **Open with Live Server**.

## Publicació amb GitHub Pages

1. Pujar el contingut de la carpeta al repositori de GitHub.
2. Anar a `Settings > Pages`.
3. Seleccionar `Deploy from a branch`.
4. Branch: `main`.
5. Folder: `/root`.
6. Desar i copiar la URL pública.

## Nota metodològica

Les dades provenen del material facilitat per a la tasca. Quan la font era una imatge o una captura, s'ha fet una estimació mensual coherent amb l'activitat d'un centre educatiu a Barcelona. El model és una eina de simulació per a la Fase 3; en una auditoria real caldria validar les xifres amb lectures oficials.
