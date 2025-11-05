/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 0,
        "min": 0,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_n2sA",
        "max": 10000,
        "min": 0,
        "name": "codeSvg",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "_clone_5XXp",
        "max": null,
        "min": null,
        "name": "largeurPont",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "_clone_yQKt",
        "max": null,
        "min": null,
        "name": "tailleVerre",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "_clone_UQEx",
        "max": null,
        "min": null,
        "name": "prixFinal",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_J6jt",
        "max": 0,
        "min": 0,
        "name": "gravure",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_6H9T",
        "max": 0,
        "min": 0,
        "name": "couleurVerre",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_CBdT",
        "max": 0,
        "min": 0,
        "name": "finition",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_987k",
        "max": 0,
        "min": 0,
        "name": "positionGravure",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_aa4F",
        "max": 0,
        "min": 0,
        "name": "materiauMonture",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_q9ZF",
        "max": 0,
        "min": 0,
        "name": "materiauBranche",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "_clone_fQHX",
        "name": "createdAt",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "_clone_kIsW",
        "name": "updatedAt",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_2426213625",
    "indexes": [],
    "listRule": null,
    "name": "v_lunettes_detai",
    "system": false,
    "type": "view",
    "updateRule": null,
    "viewQuery": "SELECT\n  l.\"id\"                                  AS id,                 -- id unique de la vue\n  l.\"code_svg\"                            AS codeSvg,\n  l.\"largeur_pont\"                        AS largeurPont,\n  l.\"taille_verre\"                        AS tailleVerre,\n  l.\"prix_final\"                          AS prixFinal,\n  l.\"gravure\"                             AS gravure,\n  l.\"couleur_verre\"                       AS couleurVerre,\n  l.\"finition\"                            AS finition,\n  l.\"position_gravure\"                    AS positionGravure,\n  m1.\"libelle\"                            AS materiauMonture,\n  m2.\"libelle\"                            AS materiauBranche,\n  l.\"created\"                             AS createdAt,\n  l.\"updated\"                             AS updatedAt\nFROM \"lunette\" AS l\nLEFT JOIN \"Materiaux\" AS m1 ON l.\"Materiaux_monture\" = m1.\"id\"\nLEFT JOIN \"Materiaux\" AS m2 ON l.\"Materiaux_branche\" = m2.\"id\";\n",
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2426213625");

  return app.delete(collection);
})
