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
        "id": "_clone_2vKA",
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
        "hidden": false,
        "id": "json1745663383",
        "maxSize": 1,
        "name": "nbCompositions",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "json3977995966",
        "maxSize": 1,
        "name": "nbCommandes",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "json3191068358",
        "maxSize": 1,
        "name": "montantTotalCommandes",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      }
    ],
    "id": "pbc_2495447861",
    "indexes": [],
    "listRule": null,
    "name": "v_stats_user",
    "system": false,
    "type": "view",
    "updateRule": null,
    "viewQuery": "WITH\nCompos AS (\n  SELECT cp.\"IdUsers\" AS userId, COUNT(1) AS nbCompo\n  FROM \"Compose\" AS cp\n  GROUP BY cp.\"IdUsers\"\n),\nCmds AS (\n  SELECT c.\"IdUtilisateur\" AS userId,\n         COUNT(1)          AS nbCmd,\n         COALESCE(SUM(c.\"total\"), 0) AS montantCumule\n  FROM \"Commande\" AS c\n  GROUP BY c.\"IdUtilisateur\"\n)\nSELECT\n  u.\"id\"                                  AS id,               -- id user = id de la vue\n  u.\"name\"                                AS userName,\n  COALESCE(co.\"nbCompo\", 0)               AS nbCompositions,\n  COALESCE(cm.\"nbCmd\", 0)                 AS nbCommandes,\n  COALESCE(cm.\"montantCumule\", 0)         AS montantTotalCommandes\nFROM \"users\" AS u\nLEFT JOIN Compos AS co ON co.userId = u.\"id\"\nLEFT JOIN Cmds  AS cm ON cm.userId = u.\"id\";\n",
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2495447861");

  return app.delete(collection);
})
