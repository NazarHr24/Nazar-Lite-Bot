const PREFIX = ":";
const NAME = `Nazar Lite [${PREFIX}help]`;
const HELP =  `-
__^^Mizar^^\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0__
\u00a0\u2022 ${PREFIX}help [cmd?]
\u00a0\u2022 ${PREFIX}source
\u00a0\u2022 ${PREFIX}say [text]
\u00a0\u2022 ${PREFIX}load [url]
\u00a0\u2022 ${PREFIX}green [url]
\u00a0\u2022 ${PREFIX}wave [url] [size?]
\u00a0\u2022 ${PREFIX}swirl [url] [deg?]`;

const SAMPLE = {
    dog: "https://files.catbox.moe/vqeiu7.webp",
    meta: "https://files.catbox.moe/d7kqea.png",
    cow: "https://files.catbox.moe/58l6sw.jpg",
};

const R = 0;
const G = 1;
const B = 2;
const A = 3;

class Img {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
    }

    static create(url) {
        return new Promise((resolve, reject) => {
            let urlObj;
            try {
                urlObj = new URL(url);
            } catch (err) {
                reject(`Invalid URL "${url}"`);
                return;
            }
            let validHosts = ["files.catbox.moe", "litter.catbox.moe"];
            if (!validHosts.includes(urlObj.hostname)) {
                reject(`Hostname "${urlObj.hostname}" is not allowed. Only files.catbox.moe and litter.catbox.moe are allowed.`);
                return;
            }
            let img = new Image();
            img.crossOrigin = "anonymous";
            img.src = url;
            img.onload = () => {
                let canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                let ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                resolve(new Img(canvas));
            };

            img.onerror = () => reject(`Invalid image ${url}`);
        });
    }

    async upload() {
        let blob = await new Promise((resolve) => this.canvas.toBlob(resolve, "image/png"));
        let formData = new FormData();
        formData.append("reqtype", "fileupload");
        formData.append("fileToUpload", blob, "image.png");
        formData.append("time", "72h");
        let res = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
            method: "POST",
            body: formData,
        });
        return await res.text();
    }

    fx(fn) {
        let width = this.canvas.width;
        let height = this.canvas.height;
        let imageData = this.ctx.getImageData(0, 0, width,height);
        let data = imageData.data;
        function p(x, y) {
            let x0 = Math.floor(x)
            let y0 = Math.floor(y);
            let x1 = x0 + 1
            let y1 = y0 + 1;
            let fx = x - x0;
            let fy = y - y0;
            let w00 = (1 - fx) * (1 - fy);
            let w10 = fx * (1 - fy);
            let w01 = (1 - fx) * fy;
            let w11 = fx * fy;

            function getPixel(xi, yi) {
                if (xi < 0 || yi < 0 || xi >= width || yi >= height) {
                    return [0, 0, 0, 0];
                }
                const idx = (yi * width + xi) * 4;
                return [
                    data[idx + R],
                    data[idx + G],
                    data[idx + B],
                    data[idx + A],
                ];
            }

            const p00 = getPixel(x0, y0);
            const p10 = getPixel(x1, y0);
            const p01 = getPixel(x0, y1);
            const p11 = getPixel(x1, y1);

            const r = Math.round(p00[R] * w00 + p10[R] * w10 + p01[R] * w01 + p11[R] * w11);
            const g = Math.round(p00[G] * w00 + p10[G] * w10 + p01[G] * w01 + p11[G] * w11);
            const b = Math.round(p00[B] * w00 + p10[B] * w10 + p01[B] * w01 + p11[B] * w11);
            const a = Math.round(p00[A] * w00 + p10[A] * w10 + p01[A] * w01 + p11[A] * w11);

            return [r, g, b, a].map(v => Math.round(v));
        }
        let dest = new ImageData(width, height);
        for (let i = 0; i < data.length; i += 4) {
            let res = fn(
                [
                    data[i + R],
                    data[i + G],
                    data[i + B],
                    data[i + A],
                ],
                i / 4 % width,
                Math.floor(i / 4 / width),
                p,
            );
            dest.data[i + R] = res[R];
            dest.data[i + G] = res[G];
            dest.data[i + B] = res[B];
            dest.data[i + A] = res[A];
        }
        this.ctx.putImageData(dest, 0, 0);
    }
}

let bot = io("//");

function send(text) {
    bot.emit("talk", {
        text: text.replaceAll("\n", "\\n"),
    });
}

let commands = {
    help({ text }) {
        if (text) {
            text = text.toLowerCase().trim().replace(PREFIX, "");
            if(Object.hasOwn(man, text)) {
                send(`- __^^${PREFIX}${text}^^__\n${man[text]}`);
            } else {
                reply(`No command "-${text}" exists.`)
            };
        } else {
            send(HELP);
        }
    },
    say({ text, reply }) {
        if (text === "") {
            reply("Retard");
        } else {
            send(text);
        }
    },
	source() {
		send("-\n^^__SOURCE CODE__^^\nMizar Lite is open source. You can run it yourself, but please change the prefix to something not in use if you're gonna do that in a public room. The code is avaiable here:\nhttps://file.garden/Z2ixc8sGKQRH3KlU/bot.js");
	}
};

let man = {
    help: `Shows all the commands. When given a command, it shows a help page on it. Refer to ${PREFIX}help help`,
	source: `Gives the source code to the bot.`,
    say: "Repeats the input.",
    load: `Loads an image into the bot. The URL can be:
\u2022 a catbox.moe link
\u2022 % (last img)
\u2022 colors, eg. black+kamala
\u2022 empty (uses your bonzi)
\u2022 a sample image
\u00a0\u25e6 -help sample
These will work in any place a URL expected.`,
    sample: "The sample images you can use are: dog, cow, meta",
    green: "Makes an image green.",
    wave: "Adds a sine wave displacement to an image.",
    swirl: "Swirls the image around the center.",
}

let colors_ = ["red", "yellow", "green", "cyan", "blue", "purple", "pink", "brown", "black", "white", "pope", "blessed", "glow", "noob"];
let hats_ = ["bucket", "troll", "bieber", "kamala", "maga", "evil", "bfdi", "elon", "tophat", "witch", "wizard", "horse", "bowtie", "obama", "cigar", "dank", "illuminati", "bear", "truck", "chain", "horse", "king"]

function loadImage(url) {
    return new Promise((resolve, reject) => {
        let img = new Image;
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = () => reject(`Huge error: ${url} failed to load`);
    });
}

async function fromColor(c) {
    let [color, ...hats] = c.split("+");
    if(!colors_.includes(color)) throw `Error: "${color}" is not a color`;
    let canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 160;
    let ctx = canvas.getContext("2d");
    let colorImg = await loadImage(`/img/bonzi/${color}.webp`);
    ctx.drawImage(colorImg, 0, 0);
    for (let hat of hats) {
        if(!hats_.includes(hat)) throw `Error: "${hat}" is not a hat`;
        let hatImg = await loadImage(`/img/bonzi/${hat}.webp`);
        ctx.drawImage(hatImg, 0, 0);
    }
    return new Img(canvas);
}

let imgFilters = {
    load({ img }) {
        return img;
    },
    green({ img, text }) {
        img.fx(([r, g, b, a]) => [0, (r + g + b) / 3, 0, a]);
        return img;
    },
    wave({ img, text }) {
        text ||= "20";
        let strength = +text;
        if (isNaN(strength)) {
            throw `Wave strength "${text}" is not a number`;
        }
        img.fx((_, x, y, p) => {
            let offset = Math.sin(x / 20) * strength;
            return p(x, y + offset);
        });
        return img;
    },
    swirl({ img, text }) {
        text ||= "90";
        let deg = +text;
        if (isNaN(deg)) {
            throw `Swirl strength "${text}" is not a number.`;
        }
        let { width, height } = img.canvas;
        let cx = width / 2;
        let cy = height / 2;
        let angle = deg * Math.PI / 180;
        img.fx((_, x, y, p) => {
            let r = Math.min(width, height) / 2 - 10;
            let dx = x - cx;
            let dy = y - cy;
            let d = Math.hypot(dx, dy);
            let cos = Math.cos(d / r * angle);
            let sin = Math.sin(d / r * angle);
            let nx = dx * cos - dy * sin + cx;
            let ny = dy * cos + dx * sin + cy;
            return p(nx, ny);
        }) 
        return img;
    }
};

let userMap = new Map;

let lastImg = await Img.create("https://files.catbox.moe/vqeiu7.webp");

function splitSpace (text) {
    let index = text.indexOf(" ");
    if (index === -1) index = text.length;
    return [text.slice(0, index), text.slice(index + 1)];
}

bot.on("talk", async ({ guid, text }) => {
    let user = userMap.get(guid);
    if (text.startsWith(PREFIX)) {
        let orig = text;
        text = text.slice(PREFIX.length);
        let [command, params] = splitSpace(text);
        if (Object.hasOwn(commands, command)) {
            commands[command]({
                text: params,
                user: user,
                reply: (text) => {
                    bot.emit("talk", {
                        text: text.replaceAll("\n", "\\n"),
                        quote: {
                            name: user.name,
                            text: orig,
                        },
                    });
                },
            });
        } else if (Object.hasOwn(imgFilters, command)) {
            let pipeline = params.split(/(?:^| )\| /);
            let curCmd = pipeline[0];
            let [url, text] = splitSpace(curCmd);
            try {
                let img;
                if (url === "%") {
                    img = lastImg;
                } else if (Object.hasOwn(SAMPLE, url)) {
                    img = await Img.create(SAMPLE[url]);
                } else if (url.startsWith("http")) {
                    img = await Img.create(url);
                } else if (colors.includes(url.split("+")[0])) {
                    img = await fromColor(url);
                } else {
                    img = await fromColor(user.color.replaceAll(" ", "+"));
                    text = `${url} ${text}`.trimStart();
                }

                img = imgFilters[command]({ img, text });
                for (curCmd of pipeline.slice(1)) {
                    let [command, text] = splitSpace(curCmd);
                    command = command.replace(PREFIX, "")
                    if (!Object.hasOwn(imgFilters, command)) {
                        throw Object.hasOwn(commands, command)
                            ? `Command -${command} cannot have images passed into` 
                            : `Unknown command "-${command}"`;
                    }
                    img = imgFilters[command]({ img, text });
                }
                lastImg = img;
                let res = await img.upload();
                bot.emit("command", {
                    list: ["image", res],
                });
            } catch (err) {
                bot.emit("talk", {
                    text: err,
                    quote: {
                        name: user.name,
                        text: orig,
                    },
                });
            }
        }
    }
});

bot.on("updateAll", (data) => {
    for (let [id, user] of Object.entries(data)) {
        userMap.set(id, user);
    }
});

bot.on("update", ({ guid, userPublic }) => userMap.set(guid, userPublic));

bot.on("leave", ({ guid }) => userMap.delete(guid));

setTimeout(() => {
    bot.emit("login", {
        name: "$r$Nazar$r$ (:help)",
        room: "default",
    });
}, 1000);