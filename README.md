# Broly

PWA de transformações no estilo Dragon Ball: Broly carrega ki, muda de forma e dispara um ataque circular. Roda no navegador, no computador e no celular.

## Como jogar

Abra `index.html` em um navegador moderno. Para tela cheia, cache offline e instalação, sirva a pasta por HTTP:

```powershell
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

- **Segure no personagem** para carregar a transformação (Base → SSJ → SSJ2 → SSJ3 → SSJ4 → God → Blue).
- **Solte** para parar na forma atual.
- No fim da sequência Super Saiyan Blue, **toque em UI ou UE** para a forma final.
- **Desenhe um círculo** na tela (fora do personagem) para o ataque de energia.
- **Toque 3 vezes** no personagem para reiniciar.

No celular, use em tela cheia (PWA). O áudio começa após o primeiro toque.

## Linguagem e tecnologias

- **HTML5** — página e canvas
- **CSS3** — tela cheia e safe-area do celular
- **JavaScript** (vanilla) — partículas, transformações, gestos e áudio
- **PWA** — `manifest.webmanifest` + `sw.js`
- **Python** (opcional) — scripts em `tools/` para tratar sprites

Sem backend: tudo roda no cliente.

## Estrutura do projeto

```
Broly/
├── index.html              # entrada do jogo
├── js/game.js              # motor, gestos e transformações
├── css/style.css           # layout em tela cheia
├── manifest.webmanifest    # metadados PWA
├── sw.js                   # cache offline
├── music.mp3               # trilha
├── aura.mp3 / scream.mp3   # efeitos principais
├── assets/
│   ├── sprites/            # idle e charge de cada forma
│   ├── sfx/                # efeitos extras
│   ├── bg/                 # cenário
│   └── icons/              # ícones do app
└── tools/                  # processamento de sprites
```

## Autor

Thomas Rangel Bugs
