"use strict";

let ctx;
let W = 12;				//作業領域の横幅
let H = 22;				//作業領域の高さ
let field;				//ブロックの状態を管理する2次元配列
let block;				//現在落下中のブロックオブジェクト
let nextBlock;			//次に出現するブロックオブジェクト
let keyevents = [];		//キー入力を保持する配列
let interval = 40;
let count;				//このゲームの世界の時計
let score;				//現在のスコア
let timer;
let colors =[			//色番号と色を対応付ける配列
	'black',
	'orange',
	'blue',
	'aqua',
	'lime',
	'fuchsia',
	'yellow',
	'red',
	'gray'
];
let blocks = [			//落下するブロックのデータ(色番号)を保持する2次元配列
	[
		[
			0, 0, 1,
			1, 1, 1,
			0, 0, 0
		],
		[
			0, 1, 0,
			0, 1, 0,
			0, 1, 1
		],
		[
			0, 0, 0,
			1, 1, 1,
			1, 0, 0
		],
		[
			1, 1, 0,
			0, 1, 0,
			0, 1, 0
		]
	],
	[
		[
			2, 0, 0,
			2, 2, 2,
			0, 0, 0
		],
		[
			0, 2, 2,
			0, 2, 0,
			0, 2, 0
		],
		[
			0, 0, 0,
			2, 2, 2,
			0, 0, 2
		],
		[
			0, 2, 0,
			0, 2, 0,
			2, 2, 0
		]
	],
	[
		[
			0, 3, 0,
			3, 3, 3,
			0, 0, 0
		],
		[
			0, 3, 0,
			0, 3, 3,
			0, 3, 0
		],
		[
			0, 0, 0,
			3, 3, 3,
			0, 3, 0
		],
		[
			0, 3, 0,
			3, 3, 0,
			0, 3, 0
		]
	],
	[
		[
			4, 4, 0,
			0, 4, 4,
			0, 0, 0
		],
		[
			0, 0, 4,
			0, 4, 4,
			0, 4, 0
		],
		[
			0, 0, 0,
			4, 4, 0,
			0, 4, 4
		],
		[
			0, 4, 0,
			4, 4, 0,
			4, 0, 0
		]
	],
	[
		[
			0, 5, 5,
			5, 5, 0,
			0, 0, 0
		],
		[
			0, 5, 0,
			0, 5, 5,
			0, 0, 5
		],
		[
			0, 0, 0,
			0, 5, 5,
			5, 5, 0
		],
		[
			5, 0, 0,
			5, 5, 0,
			0, 5, 0
		]
	],
	[
		[
			6, 6,
			6, 6
		],
		[
			6, 6,
			6, 6
		],
		[
			6, 6,
			6, 6
		],
		[
			6, 6,
			6, 6
		]
	],
	[
		[
			0, 7, 0, 0,
			0, 7, 0, 0,
			0, 7, 0, 0,
			0, 7, 0, 0
		],
		[
			0, 0, 0, 0,
			7, 7, 7, 7,
			0, 0, 0, 0,
			0, 0, 0, 0
		],
		[
			0, 0, 7, 0,
			0, 0, 7, 0,
			0, 0, 7, 0,
			0, 0, 7, 0
		],
		[
			0, 0, 0, 0,
			0, 0, 0, 0,
			7, 7, 7, 7,
			0, 0, 0, 0
		]
	]
];

//落下中のブロックの情報を管理するオブジェクト
function Block() {
	//現在のブロックの向きを0〜3の値で保持
	this.turn = rand(4);
	//どのブロックを参照するか保持するプロパティ
	//ブロックの種類の個数はblocks.lengthで取得
	//その値をrand関数に渡して乱数でブロックを選択
	this.type = blocks[rand(blocks.length)];
	//そのタイプ、その向きに特化したデータを保持
	this.data = this.type[this.turn];
	//2 or 3 or 4
	//縦横のサイズを表す
	//ブロックの数の平方根から求める
	this.w = Math.sqrt(this.data.length);
	//落下開始時のx座標
	this.x = rand(6 - this.w) + 2;
	//落下開始時のy座標
	this.y = 1 - this.w;
	//次に落下する時刻
	this.fire = interval + count;

	//ブロックの状態を更新
	this.update = function () {
		//一番下に到達？
		//指定された場所と向きでブロックが衝突するか判定
		//ブロックのy座標の値に1を加えて引数に渡すことで更に下に進めるかチェック
		if (isHit(this.x, this.y + 1, this.turn)) {
			//blockの内容をfieldにコピー
			processBlockCells(function (x, y, value) {
				field[y][x] = value;
			});
			//ブロックが下に到達したら行を削除
			let erased = eraseLine();
			//消せた場合
			if (erased > 0) {
				//行数が戻り値で返るためスコアを加算
				score += Math.pow(2, erased) * 10;
			}
			keyevents = [];
			//新しいブロックに切り替え
			goNextBlock();
		}
		//ブロックを1行下へ移動
		//fireでブロックを下に移動させる時間を保持
		//時間が経過したら
		if (this.fire < count) {
			//次の時間をセット
			this.fire = count + interval;
			//ブロックを下に移動
			this.y++;
		}
		//キーイベントの処理
		//keyeventsが空になるまで
		while (keyevents.length > 0) {
			//一つのイベントを取り出す
			let code = keyevents.shift();
			//次の座標
			let dx = 0;
			let dy = 0;
			//次の向き
			let nd = this.turn;
			switch (code) {
				//スペースキー押下時
				case 32:
					//次の向きを求める
					nd = (nd + 1) % 4;
					break;
				case 37:
					dx = -1;
					break;
				case 39:
					dx = +1;
					break;
				case 40:
					dy = +1;
					break;
				default:
					continue;
			}
			//次の座標と向きが衝突しないか否かを判定
			if (!isHit(this.x + dx, this.y + dy, nd)) {
				//更新
				this.x = this.x + dx;
				this.y = this.y + dy;
				this.turn = nd;
				this.data = this.type[this.turn];
			}
		}
	};

	//blockのセルを描画
	this.draw = function (ctx) {
		processBlockCells(function (x, y, value) {
			ctx.fillStyle = colors[value];
			ctx.fillRect(50 + x * 25, 25 + y * 25, 24, 24);
		});
	};
}

//0〜rまでの整数の乱数を返す
function rand(r) {
	return Math.floor(Math.random() * r);
}

//関数オブジェクトを引数にとり、blockの各マスについてその関数オブジェクトを実行
function processBlockCells(func) {
	for (let i = 0; i < block.data.length; i++) {
		let x = i % block.w;
		let y = Math.floor(i / block.w);
		let v = block.data[i];
		//x, yが一定の範囲に収まっている場合
		if (0 <= y + block.y &&
			y + block.y < H &&
			0 <= x + block.x &&
			block.x < W &&
			v != 0) {
			//引数で受け取った関数オブジェクトfuncを呼び出す
			//funcの引数はblockを基準としての「x、y、そのセルの値」
			func(x + block.x, y + block.y, v);
		}
	}
}

//最初に実行される関数
function init() {
	//コンテキストを取得
	let canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');
	//フォントをセット
	ctx.font = "20pt Arial";
	//イベントハンドラーを登録
	//キー押下時
	addEventListener('keydown', function (e) {
		//keyCodeを配列keyeventsに格納
		keyevents.push(e.keyCode);
	});
	count = 0;
	score = 0;
	//フィールドの初期化
	field = new Array(H);
	for (let y = 0; y < H; y++) {
		field[y] = new Array(W);
		for (let x = 0; x < W; x++) {
			//2次元配列を作成
			//端「x == 0 || x == W - 1」と
			//底「field[H - 1][i]」を壁にするために8を代入
			field[y][x] = (x == 0 || x == W -1) ? 8:0;
		}
	}
	for (let i = 0; i < W; i++) {
		field[H - 1][i] = 8;
	}
	//ブロックの初期化
	goNextBlock();
	//メインループの開始
	timer = setInterval(mainLoop, 10);
}

//メインループ
function mainLoop() {
	count++;
	//1000単位でintervalを減少させてスピードアップ
	if (count % 1000 == 0) {
		interval = Math.max(1, interval - 1);
	}
	//ブロックの位置を更新
	block.update();
	//ゲームオーバーの判定
	if (isGameOver()) {
		//タイマーを停止
		clearInterval(timer);
		timer = NaN;
	}
	//描画を更新
	draw();
}

//ゲームオーバーかを判定
function isGameOver() {
	let filled = 0;
	//0行目、すなわち一番上の行でその中で0以外のマス目の数を数える
	field[0].forEach(function (c) {
		if (c != 0) {
			filled++;
		}
	});
	//左右の壁もあるため、その数が2より大きい場合に真を返す
	return filled > 2;
}

//次のブロックに切り替える
function goNextBlock() {
	//もしnextBlockが偽でない場合
	//すなわち何らかの値が格納されている場合
	//その内容がblockに格納される
	block = nextBlock || new Block();
	//nextBlockが空のときはnew Block()の値がblockに格納される
	nextBlock = new Block();
}

//ブロックがx, yの位置で向きがrのときに衝突するか判定
function isHit(x, y, r) {
	let data = block.type[r];
	for (let i = 0; i < block.w; i++) {
		for(let j = 0; j < block.w; j++) {
			if (i + y >= 0 &&
				j + x >= 0 &&
				i + y < H &&
				j + x < W &&
				//fieldの値を参照
				field[i + y][j + x] != 0 &&
				//blockの値を参照
				data[i * block.w + j] != 0) {
				return true;
			}
		}
	}
	return false;
}

//ブロックが一番下に到達したときに行が消せるかチェック
function eraseLine() {
	let erased = 0;
	//下から上へ
	for (let y = 20; y >= 0; y--) {
		//行が全部埋まっているか否か
		//everyは配列の要素に対してコールバックを呼び出し、
		//それらのコールバックがすべて真を返したときに全体が真となる
		if (field[y].every(function (v) {
			return v != 0;
		})) {
			erased++;
			//該当する一行削除
			field.splice(y, 1);
			//一番上に一行追加
			field.unshift(new Array(W));
			for (let i = 0; i < W; i++) {
				field[0][i] = (i == 0 || i == W - 1) ? 8:0;
			}
			//消去した行からもう一度チェック
			y++;
		}
	}
	return erased;
}

//描画用
function draw() {
	//背景の塗り潰し
	ctx.fillStyle = 'rgb(0, 0, 0';
	ctx.fillRect(0, 0, 600, 600);
	//フィールドの描画
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			let v = field[y][x];
			ctx.fillStyle = colors[v];
			ctx.fillRect(50 + x * 25, 25 + y * 25, 24, 24);
		}
	}
	//落下中のブロックの描画
	block.draw(ctx);
	//次に出現するブロックの描画
	nextBlock.data.forEach(function (v, i, data) {
		let w = Math.sqrt(data.length);
		let x = i % w;
		let y = Math.floor(i / w);
		ctx.fillStyle = colors[v];
		ctx.fillRect(400 + x * 25, 300 + y * 25, 24, 24);
	});
	//各情報の描画
	ctx.fillStyle = 'rgb(0,255,0)';
	ctx.fillText('score:', 400, 130);
	ctx.fillText('next:', 400, 270);
	ctx.fillText(('0000000' + score).slice(-7), 400, 170);
	if (isNaN(timer)) {
		ctx.fillText('GAME OVER', 380, 70);
	}
}