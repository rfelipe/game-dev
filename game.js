window.onload = function() {
    // Cria o cenário com 1220 x 600 px
    game = new Phaser.Game(1000, 640, Phaser.AUTO, '', {
        preload: carregaAssets,
        create: criaCenario, 
        update: atualizaJogo
    });
};

var textoMoedas;
var contadorMoedas = 0;

/**
 *  Carrega imagens, sons etc, para usar no jogo
 */
function carregaAssets() {
    game.load.image('inimigo', 'assets/inimigo.png');
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);

    // Carrega imagem do novo mapa,
    // origem: http://www.ironstarmedia.co.uk/2010/10/free-game-assets-13-prototype-mine-tileset/
    game.load.image('tilesCenario', 'assets/tileset.png');

    // Carrega mapa em formato JSON
    game.load.tilemap('mapa', 'assets/mapacaverna.json', null, Phaser.Tilemap.TILED_JSON);

    // Carrega moedas
    game.load.spritesheet('coin', 'assets/coin.png', 32, 32);
    // Carrega som para moedas
    game.load.audio('collect-coin', ['assets/collect-coin.ogg']);
    // Carrega som para pulo em cima de algo
    game.load.audio('kick', ['assets/kick.ogg']);
    // Carega som de fim do jogo
    game.load.audio('lose', ['assets/lose.ogg']);
}

/**
 *  Cria cenário do jogo
 */
function criaCenario() {
    // Define que vai usar a física ARCADE - fácil no jogo
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Adiciona mapa
    map = game.add.tilemap('mapa');

    // Insere tileset
    map.addTilesetImage('tileset', 'tilesCenario');

    // Define quais blocos do tileset serão de colisão
    //map.setCollision(1);
    map.setCollisionBetween(1,5);
    map.setCollisionBetween(8,12);

    // Cria camada do cenário e define-a do tamanho do mundo
    layer = map.createLayer('cenario');
    layer.resizeWorld();

    // Cria camada das escadas não visível
    layerEscada = map.createLayer('camadaEscada');
    layerEscada.visible = false;

    // Cria o jogador
    criaJogador();

    // Chama função que cria vários inimigos
    criaInimigos();

    // Define os cursores do teclado para poder controlar o jogador
    cursors = game.input.keyboard.createCursorKeys();

    criaMoedas();

    criaTextoPontuacao();

    // Adiciona objeto de controle de músicas do jogo
    musicaMoedas = game.add.audio('collect-coin', 1, true);
    musicaKick = game.add.audio('kick', 1, true);
    musicaLose = game.add.audio('lose', 1, true);
}


/**
 *  Função que cria texto de pontuação do jogo
 */

/**
 *  Atualiza jogo. Esta função roda em torno de 60 vezes em 1 segundo, ou seja,
 *  60 FPS (FPS = Frames Por Segundo)
 */
function atualizaJogo() {
    game.physics.arcade.collide(jogador, layer);
    game.physics.arcade.collide(inimigos, layer, inimigoColidiuTile);

    movimentaJogador();
    verificaSeEncostouInimigo();
    verificaSeEncostouMoedas();
    verificaEscada();
}

function criaTextoPontuacao(){
    // Cria imagem genérica
    var myBitmap = game.add.bitmapData(200, 40);
    // Define fundo
    myBitmap.context.fillStyle = "#FFFFFF";
    // Desenha retângulo
    myBitmap.context.fillRect(0,0,200,40);
    // Cria sprite e adiciona-a no jogo
    sprite = game.add.sprite(20, 20, myBitmap);
    // Faz sprite seguir câmera
    sprite.fixedToCamera = true;
     
    // Cria texto para exibir pontuação do usuário
    textoMoedas = game.add.text(25, 30, "Pontuação: " + contadorMoedas + " moedas" , {
        font: "18px Arial",
        fill: "#",
        align: "left"
    });

    // Faz texto seguir câmera
    textoMoedas.fixedToCamera = true;
}

function verificaSeEncostouInimigo(){
    // Verifica colisão entre jogador e inimigos
    game.physics.arcade.collide(jogador, inimigos, encostouInimigo);
}


function movimentaJogador(){
    // Pára o movimento do jogador
    jogador.body.velocity.x = 0;

    if (cursors.left.isDown)
    {
        //  Move to the left
        jogador.body.velocity.x = -250;

        jogador.animations.play('left');
    }
    else if (cursors.right.isDown)
    {
        //  Move to the right
        jogador.body.velocity.x = 250;

        jogador.animations.play('right');
    }
    else
    {
        //  Stand still
        jogador.animations.stop();

        jogador.frame = 4;
    }

    //  Permite jogador pular somente se está tocando algum chão
    if (cursors.up.isDown)
    {
        if (jogador.body.onFloor())
        {
            jogador.body.velocity.y = -650;
        }
    }


    // Truque para jogador voar ao pressionar tecla T
    if(game.input.keyboard.isDown(Phaser.Keyboard.T) && cursors.up.isDown)
    {
        jogador.body.velocity.y = -150;
    }
}


/**
 * Função que cria o jogador
 */
function criaJogador(){
    // Cria o player e o adiciona no jogo (x,y)
    jogador = game.add.sprite(50, game.world.height - 250, 'dude');

    // É necessário adicionar a física no jogador
    game.physics.enable(jogador);

    // Propriedades da física do jogador. Dá a ele, um salto "normal".
    jogador.body.bounce.y = 0.2;
    jogador.body.gravity.y = 1600;
    jogador.body.linearDamping = 1;

    // Nâo deixa jogador "fugir" do mundo
    jogador.body.collideWorldBounds = true;

    // Define duas animações (esquerda e direita) para caminhar
    // 'nome', posições no quadro, quantas atualizações por segundo
    jogador.animations.add('left', [0, 1, 2, 3], 10, true);
    jogador.animations.add('right', [5, 6, 7, 8], 10, true);

    game.camera.follow(jogador);
}


/**
 * Função que cria o jogador
 */
function criaInimigos(){
    // O grupo inimigos será usado para gerenciar todos os inimigos
    inimigos = game.add.group();
    // Definimos aqui que qualquer inimigo terá um corpo,
    // ou seja, nosso personagem pode bater nele
    inimigos.enableBody = true;

    /**
     * Carrega moedas do grupo camadaInimigos (criado no tiled map editor) que estejam usando 
     * o GID 28 (tileset número 28). 
     * Substitui todos os inimigos pela imagem 'inimigo' carregada em carregaAssets 
     * e insere todos eles no grupo inimigos recém criado
     */
    map.createFromObjects('camadaInimigos', 28, 'inimigo', 0, true, false, inimigos);


    /**
     *  Faz cada inimigo adicionado ir em direção ao jogador
     */
    for (var i = 0; i < inimigos.length; i++){
        var inimigo = inimigos.children[i];

        inimigo.body.velocity.x -= 100;
    }
}



/**
 * Carrega moedas no jogo e define seu comportamento
 */
function criaMoedas(){
    // Adiciona música da moeda no jogo, com o nome do asset (collect-coin)
    musicaMoedas = game.add.audio('collect-coin', 1, true);

    // Cria grupo de moedas
    coins = game.add.group();
    // Habilita corpo nos elementos deste grupo
    coins.enableBody = true;

    /**
     * Carrega moedas do grupo camadaMoedas (criado no tiled map editor) que estejam usando 
     * o GID 22 (tileset número 22). 
     * Substitui todas as moedas pela imagem 'coin' carregada em carregaAssets 
     * e insere todoas elas no grupo coins recém criado
     */
    map.createFromObjects('camadaMoedas', 22, 'coin', 0, true, false, coins);

    // Adiciona a função add no objeto animations e cria animação giraMoeda em todos as moedas
    coins.callAll('animations.add', 'animations', 'giraMoeda', [0, 1, 2, 3, 4, 5], 10, true);
    // Chama animação recém criada (giraMoeda) em todas as moedas
    coins.callAll('animations.play', 'animations', 'giraMoeda');
}

/**
 *  Função que gerencia conexão com inimigo
 */
function encostouInimigo (jogador, inimigo) {
    // Verifica se pulou em cima do inimigo
    if (jogador.body.touching.down && inimigo.body.touching.up){
        // Mata inimigo
        inimigo.kill();
        // Faz jogador pular
        jogador.body.velocity.y = -650;
        // Executa música de pulo em algo
        musicaKick.play('', 0, 1, false);
    }else{
        // Termina jogo
        fimDoJogo();
    }
}


/**
 *  Função que termina o jogo, removendo jogador e rodando música
 *  de final do jogo. Por fim, exibe texto para usuário informando que morreu
 */
function fimDoJogo(){
    // Remove jogador do jogo
    jogador.kill();

    // Mostra texto informando morte do jogador
    var posicaoJogador = jogador.body.position.x;

    var textoJogo = game.add.text(posicaoJogador - 150, game.camera.height / 2, "Você morreu", {
        font: "48px Arial",
        fill: "#ff0044",
        align: "center"
    });

    // Roda música de fim do jogo
    musicaLose.play('', 0, 1, false);
}

/**
 * Verifica colisão entre jogador e moedas e chama função encostouEmMoeda 
 * quando isso ocorrer
 */
function verificaSeEncostouMoedas(){
    game.physics.arcade.overlap(jogador, coins, encostouEmMoeda, null, this);
}

/**
 * Quando jogador encosta em moeda, chama esta função
 * que irá dar play no som da moeda e remover a moeda do jogo
 */
function encostouEmMoeda(player, moeda) {
    // Executa som da moeda por 1 segundo
    musicaMoedas.play('', 0, 1, false);
    // Exclui a moeda do jogo
    moeda.kill();

    // Contabiliza moedas
    contabilizaMoedas();
}



/**
 *  Detecta colisão entre inimigo e cenário
 */
function inimigoColidiuTile(inimigo, cenario){
    // Se o inimigo encostou em algo na esquerda, manda-o para direita
    if (inimigo.body.blocked.left){
        inimigo.body.velocity.x += 100;
    }

    // Se o inimigo encostou em algo na direita, manda-o para esquerda
    if (inimigo.body.blocked.right){
        inimigo.body.velocity.x -= 100;
    }
}


/**
 *  Incrementa contador de moedas e exibe novo valor para jogador
 */
function contabilizaMoedas(){
    // Incrementa contador
    contadorMoedas++;

    // Atualiza texto
    textoMoedas.setText('Pontuação: ' + contadorMoedas + ' moedas');
}


/**
 *  Função que verifica se jogador encostou em uma escada e se
 *  ao mesmo tempo pressionou a tecla cima
 */
function verificaEscada(){
    // Aqui revificamos se o jogador está em "cima" de um bloco de escada na camada layerEscada
    var encostouEmEscada = map.getTileWorldXY(jogador.body.x + 16, jogador.body.y,32,32, layerEscada);

    // Verifica se encostou em um bloco de escada e se pressionou a tecla cima
    if ( encostouEmEscada && cursors.up.isDown ) {
        // Altera gravidade do jogador
        jogador.body.gravity.y = 0;
        // Leva o jogador um pouco para cima
        jogador.body.velocity.y = -150;
        // Não permite jogador ir para o lado
        jogador.body.velocity.x = 0;
        // Define que está na escada (usada para controlar movimentos do jogador)
        jogadorNaEscada = true;
    }else{
        // Se não está na escada, restabelece a gravidade normal do jogador
        jogador.body.gravity.y = 1600;
        // Define que não está na escada
        jogadorNaEscada = false;
    }
}