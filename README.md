# Popup Notes - (Sticky notes for your computer.)

> A lightweight, Private, note-taking desktop app for your personal computer.

### Features
1. Add as many popup notes as you like.
2. Select notes to be hidden or visible.
3. Drag notes to change their positions.
4. Only three notes will show in your notes popup, to see other notes simply scroll left. 
5. Text formatting on note contents works. 
6. Save note contents with CTRL+s.

You can check out the version published for `Chrome` from the `Web store` [here](https://chromewebstore.google.com/detail/popup-notes/hhjohcocfnbiedkenellfdbfcieilkce?authuser=0&hl=en), and you can check out the published version for `Mozilla Firefox` [here](https://addons.mozilla.org/en-GB/firefox/addon/popup-notes/), as well as the Microsoft Edge version [here](https://microsoftedge.microsoft.com/addons/detail/kjgbjbghhflchldehakdoaemaidlnldi).


- Note: When distributing for Chrome, use background/service_workers: 

```
  "background": {
    "service_worker": "background.js"
  },
```

and use background/scripts for the Mozilla distribution.

```
  "background": {
    "scripts": [
      "background.js"
    ]
  },
```

- For mozilla, before getting zip file for version updated, go into the Project folder, select all files/folders, then compress that selection, to enable mozilla ready the manifest.
