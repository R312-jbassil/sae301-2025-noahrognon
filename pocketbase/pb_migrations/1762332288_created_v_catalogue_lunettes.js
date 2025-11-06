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
        "id": "_clone_vhAL",
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
        "id": "_clone_5Qrl",
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
        "id": "_clone_4tBi",
        "max": 0,
        "min": 0,
        "name": "matMonture",
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
        "id": "_clone_uvXk",
        "max": 0,
        "min": 0,
        "name": "matBranche",
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
        "id": "_clone_rLZu",
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
        "id": "_clone_lsDt",
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
        "hidden": false,
        "id": "_clone_dr2E",
        "name": "createdAt",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_3314038252",
    "indexes": [],
    "listRule": null,
    "name": "v_catalogue_lunettes",
    "system": false,
    "type": "view",
    "updateRule": null,
    "viewQuery": "SELECT\n  l.\"id\"                                  AS id,\n  l.\"code_svg\"                            AS codeSvg,\n  l.\"prix_final\"                          AS prixFinal,\n  m1.\"libelle\"                            AS matMonture,\n  m2.\"libelle\"                            AS matBranche,\n  l.\"couleur_verre\"                       AS couleurVerre,\n  l.\"finition\"                            AS finition,\n  l.\"created\"                             AS createdAt\nFROM \"lunette\" AS l\nLEFT JOIN \"Materiaux\" AS m1 ON l.\"Materiaux_monture\" = m1.\"id\"\nLEFT JOIN \"Materiaux\" AS m2 ON l.\"Materiaux_branche\" = m2.\"id\";\n",
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3314038252");

  return app.delete(collection);
})
