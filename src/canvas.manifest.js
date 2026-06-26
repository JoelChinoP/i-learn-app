export const manifest = {
  screens: {
    scr_09ckjx: { name: "Alumno", route: "/alumno", position: { "x": 160, "y": 220 } },
    scr_apuqp4: { name: "Padre · Resumen", route: "/padre", position: { "x": 1560, "y": 220 } },
    scr_193ui0: { name: "Padre · Detalle y tendencia", route: "/padre/detalle", position: { "x": 160, "y": 2200 } },
    scr_h2biss: { name: "Padre · Configuración", route: "/padre/config", position: { "x": 1560, "y": 2200 } },
    scr_p2oiy5: { name: "Instructor · Panel", route: "/instructor", position: { "x": 2960, "y": 220 } },
    scr_nxncht: { name: "Instructor · Detalle alumno", route: "/instructor/alumno/Alumno%20A", position: { "x": 160, "y": 4180 } },
    scr_kk5s3k: { name: "Instructor · Configuración", route: "/instructor/config", position: { "x": 1560, "y": 4180 } }
  },
  sections: {
    sec_fu6uig: { name: "User Role Selection", x: 0, y: 0, width: 4320, height: 1180 },
    sec_121dj8: { name: "Padre Flow", x: 0, y: 1980, width: 2920, height: 1180 },
    sec_x646yq: { name: "Instructor Flow", x: 0, y: 3960, width: 2920, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_fu6uig", children: [
    { kind: "screen", id: "scr_09ckjx" },
    { kind: "screen", id: "scr_apuqp4" },
    { kind: "screen", id: "scr_p2oiy5" }]
  },
  { kind: "section", id: "sec_121dj8", children: [
    { kind: "screen", id: "scr_193ui0" },
    { kind: "screen", id: "scr_h2biss" }]
  },
  { kind: "section", id: "sec_x646yq", children: [
    { kind: "screen", id: "scr_nxncht" },
    { kind: "screen", id: "scr_kk5s3k" }]
  }]

};