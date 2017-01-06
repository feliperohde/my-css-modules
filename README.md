# Instalação #

É preciso ter previamente instado na maquina
- nodejs e npm

É preciso ter instalado globalmente:
- gulp
- stylus
- jeet
- jade

Na raiz do projeto basta rodar:
- npm install



# Uso #

Gulp

gulp build é responsável por gerar código para produção

gulp serve cria e mantem um server local para desenvolvimento alem de manter um watcher para livereload usando browsersync

gulp test é responsável por executar os tester unitários do source

As tarefas podem ser rodadas com as seguintes diretivas

```
--open fará abrir o browser com a aplicação rodando
--obfuscate responsável por habilitar os métodos de obfuscaçao/normalização de código, deve ser usada concomitantemente com uma das diretivas abaixo ou o código somente será convertido para camelcase
    --md5 obfuscação com md5
    --crc16 obfuscação com crc16
    --crc32 obfuscação com crc32
    --shake256 obfuscação com shake256, esta diretiva aceita um parametro (int) para base de cálculo na obfuscação, o default é 48 bits

--compress fará com que o código fique minificado e comprimido com gzip
```

------------
exemplo de uso:

gulp serve --open --obfuscate --shake256=64 --compress

É importante saber escolher o método de obfuscação quando usado devido as altas chances de colisão de algumas delas, à exemplo a crc16 que somente deve ser usada em projetos pequenos.

# Recursos #
- jeet: http://jeet.gs/
- nib: https://tj.github.io/nib/
- rupture: http://jescalan.github.io/rupture/

# Todo #
- Criar uma documentação que torne irresistível o uso deste starter kit
- Testes de regressão visual com casperjs
- Dar suporte para sass usando a mesma estrutura
- Criar um scafolding para este repositorio usando slushjs
- Criar um  virtual DOM igual/parecido/melhor vue.js/react.js
- Criar um parser para json para ser usado com gerador de sites staticos com jade/pug
- Melhorar a forma da geração dos mapas de css usando postCss.
- Criar novos métodos de obfuscação