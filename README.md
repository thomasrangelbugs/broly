# Broly

PWA de transformações no estilo Dragon Ball: escolha o personagem, carregue ki, mude de forma e dispare um ataque. Roda no navegador, no computador e no celular.

## Como jogar

Abra `index.html` em um navegador moderno. Para tela cheia, cache offline e instalação, sirva a pasta por HTTP:

```powershell
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

- **Toque no retrato** (ou escolha na lista) para trocar de personagem: Broly, Goku, Vegeta, Gohan, Goku Black, Cell, Freeza e Majin Buu.
- **Segure no personagem** para carregar a transformação daquela trilha.
- **Solte** para parar na forma atual.
- No fim da trilha, toque na **forma suprema** (Legend, UI, UE, Rose, Beast, Cell Ultra, Black Freeza, Kid Buu — conforme o personagem).
- **Desenhe um círculo** na tela (fora do personagem) para o ataque de energia.
- **Toque 3 vezes** no personagem para reiniciar.

No celular, use em tela cheia (PWA). O áudio começa após o primeiro toque. Há trilhas extras (`music.mp3`, `music2.mp3`, `music3.mp3`).

## Linguagem e tecnologias

- **HTML5** — página e canvas
- **CSS3** — tela cheia e safe-area do celular
- **JavaScript** (vanilla) — elenco, partículas, transformações, gestos e áudio
- **PWA** — `manifest.webmanifest` + `sw.js`
- **Python** (opcional) — scripts em `tools/` para tratar sprites

Sem backend: tudo roda no cliente.

## Estrutura do projeto

```
Broly/
├── index.html              # entrada do jogo
├── js/game.js              # motor, elenco, gestos e transformações
├── css/style.css           # layout em tela cheia
├── manifest.webmanifest    # metadados PWA
├── sw.js                   # cache offline
├── music.mp3 / music2.mp3 / music3.mp3
├── aura.mp3 / aurarose.mp3 / scream.mp3
├── assets/
│   ├── sprites/            # idle e charge de cada forma
│   ├── portraits/          # retratos de seleção
│   ├── sfx/                # efeitos extras
│   ├── bg/                 # cenários por personagem
│   └── icons/              # ícones do app
└── tools/                  # processamento de sprites
```

## Autor

Thomas Rangel Bugs
