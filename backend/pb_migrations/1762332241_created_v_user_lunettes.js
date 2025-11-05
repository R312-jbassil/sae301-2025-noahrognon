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
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation1689669068",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "userId",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_RPI5",
        "max": 255,
        "min": 0,
        "name": "userName",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_340737475",
        "hidden": false,
        "id": "relation4129913273",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "lunetteId",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "_clone_GidS",
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
        "hidden": false,
        "id": "_clone_X3X9",
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
        "id": "_clone_KcmU",
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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "_clone_auQd",
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
        "id": "_clone_RGsK",
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
        "id": "_clone_mG8i",
        "name": "dateCreationLunette",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_1728043915",
    "indexes": [],
    "listRule": null,
    "name": "v_user_lunettes",
    "system": false,
    "type": "view",
    "updateRule": null,
    "viewQuery": "SELECT\n  (ROW_NUMBER() OVER())                  AS id,                 -- id synthétique requis\n  u.\"id\"                                 AS userId,\n  u.\"name\"                               AS userName,\n  l.\"id\"                                 AS lunetteId,\n  l.\"prix_final\"                         AS prixFinal,\n  l.\"taille_verre\"                       AS tailleVerre,\n  l.\"largeur_pont\"                       AS largeurPont,\n  m1.\"libelle\"                           AS materiauMonture,\n  m2.\"libelle\"                           AS materiauBranche,\n  l.\"created\"                            AS dateCreationLunette\nFROM \"Compose\" AS cp\nJOIN \"users\"   AS u  ON cp.\"IdUsers\"   = u.\"id\"\nJOIN \"lunette\" AS l  ON cp.\"IdLunette\" = l.\"id\"\nLEFT JOIN \"Materiaux\" AS m1 ON l.\"Materiaux_monture\" = m1.\"id\"\nLEFT JOIN \"Materiaux\" AS m2 ON l.\"Materiaux_branche\" = m2.\"id\";\n",
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1728043915");

  return app.delete(collection);
})
