/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
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
        "id": "text3949269562",
        "max": 0,
        "min": 0,
        "name": "code_svg",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number1396272600",
        "max": null,
        "min": null,
        "name": "largeur_pont",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number4105839681",
        "max": null,
        "min": null,
        "name": "taille_verre",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number211432088",
        "max": null,
        "min": null,
        "name": "prix_final",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text226133114",
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
        "hidden": false,
        "id": "select3682605528",
        "maxSelect": 1,
        "name": "couleur_verre",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "#rtrberbrt",
          "#fvetbertb"
        ]
      },
      {
        "hidden": false,
        "id": "select543225894",
        "maxSelect": 1,
        "name": "finition",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "brillant"
        ]
      },
      {
        "hidden": false,
        "id": "select2659947913",
        "maxSelect": 1,
        "name": "position_gravure",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "Branche droite",
          "Branche gauche"
        ]
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_340737475",
    "indexes": [],
    "listRule": null,
    "name": "lunette",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_340737475");

  return app.delete(collection);
})
