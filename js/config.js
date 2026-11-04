/* ============================================================
 * 溯世行 v3 — 配置与数据模块
 * ------------------------------------------------------------
 * 包含：常量定义、18关叙事数据、朝代视觉配置
 * 所有数据集中管理，便于调整与扩展
 * ========================================================== */

// ─── 核心常量 ───
const W = 1280, H = 720;          // 画布尺寸
const GY = 580;                    // 地面高度
const G = 0.62;                    // 重力加速度
const BS = 6.8;                    // 基础速度
const MS = 15;                     // 最大速度
const PX = 220;                    // 玩家屏幕 X 坐标
const DIST_SCALE = 1.65;           // 关卡距离缩放（延长游玩时间）

// ─── 关卡数据 (18关完整版) ───
// at = 叙事触发距离（将乘以 DIST_SCALE）
// dyn = 朝代视觉索引 → DYNASTY_VIS
// weather = 天气类型（影响玩法速度与画面）
// obi = 障碍物类型池
const LEVELS = [
  {name:'茹毛泣土',era:'原始社会',sub:'约200万年前—公元前2070年',dyn:0,
   weather:'rain',spMod:1,visMod:1,obi:['rock','rock','rock','fire'],
   narrative:[
     {at:300,t:'一位原始人将自己的食物分给了受伤的同伴。',n:'茹毛饮血，亦有温情'},
     {at:800,t:'他自己却饿死了。同伴把他的尸体埋在树下，刻了一个记号。',n:'最早的牺牲'},
     {at:1150,t:'火光照亮了洞壁上的手印。那是人类最早的签名。',n:'洞穴之光'},
     {at:1500,t:'篝火燃起，驱散了野兽，也引来了更多饥饿的人群。',n:'火光中的选择'},
     {at:2200,t:'火的发现，照亮了人类文明的第一个黎明。',n:'最初的火种'}
   ],quote:'天若不生人，万古如长夜。'},
  {name:'禅让残风',era:'上古五帝',sub:'约公元前2600年—公元前2070年',dyn:0,
   weather:'clear',spMod:1,visMod:1,obi:['rock','spear'],
   narrative:[
     {at:400,t:'大禹路过家门，听到里面孩子的哭声。',n:'治水十三年'},
     {at:1000,t:'他在门口站了片刻，然后转身走向了滔滔黄河。',n:'三过家门'},
     {at:1400,t:'舜帝在历山耕田，大象为他犁地，鸟儿为他除草。德行感天。',n:'德感天地'},
     {at:1800,t:'他的手上全是老茧，脚上全是水泡。',n:'以身为度'},
     {at:2600,t:'"天下有道，丘不与易也。"',n:'圣人之劳'}
   ],quote:'三过其门而不入。'},
  {name:'青铜饕餮',era:'夏商周',sub:'公元前2070年—公元前256年',dyn:1,
   weather:'clear',spMod:1.05,visMod:1,obi:['rock','spear','wall'],
   narrative:[
     {at:500,t:'青铜鼎在烈火中铸成。饕餮纹饰缓缓流动，仿佛活了过来。',n:'青铜时代'},
     {at:1200,t:'编钟的声音从远处传来，低沉而悠远。',n:'礼乐之邦'},
     {at:1600,t:'甲骨上的裂纹，是祖先与神灵的对话。每一个字，都是一次叩问。',n:'甲骨问天'},
     {at:2000,t:'比干挖出自己的心，一步一步走向摘星楼。',n:'七窍玲珑'},
     {at:2800,t:'武王伐纣，牧野之战。青铜与鲜血铸就了新的天下。',n:'天命靡常'}
   ],quote:'天命玄鸟，降而生商。'},
  {name:'百家争鸣',era:'春秋战国',sub:'公元前770年—公元前221年',dyn:8,
   weather:'clear',spMod:1.08,visMod:1,obi:['spear','wall','spear','rock'],
   narrative:[
     {at:400,t:'孔子周游列国，马车在泥泞中颠簸。身后是七十二弟子。',n:'周游列国'},
     {at:1000,t:'老子骑青牛出函谷关。关令尹喜跪求五千言。',n:'紫气东来'},
     {at:1350,t:'孟子见梁惠王。"王何必曰利？亦有仁义而已矣。"',n:'仁义之辩'},
     {at:1700,t:'墨子赤脚走在去楚国的路上，要去阻止一场战争。',n:'兼爱非攻'},
     {at:2050,t:'庄子梦蝶。不知周之梦为蝴蝶与？蝴蝶之梦为周与？',n:'庄周梦蝶'},
     {at:2400,t:'屈原站在汨罗江边，佩兰戴芷，纵身一跃。',n:'离骚九歌'},
     {at:3000,t:'百家争鸣，思想的火种在乱世中熊熊燃烧。',n:'轴心时代'}
   ],quote:'路漫漫其修远兮，吾将上下而求索。'},
  {name:'竹简帛书',era:'秦汉',sub:'公元前221年—公元220年',dyn:2,
   weather:'sand',spMod:1.1,visMod:0.85,obi:['spear','fire','wall'],
   narrative:[
     {at:500,t:'秦始皇站在长城之上，身后是燃烧的竹简。',n:'焚书坑儒'},
     {at:1200,t:'万里长城在夕阳下延伸，每一块砖下都埋着一个人的名字。',n:'血肉长城'},
     {at:1600,t:'司马迁在狱中写下《史记》。"人固有一死，或重于泰山，或轻于鸿毛。"',n:'史家绝唱'},
     {at:2000,t:'项羽在乌江边拔剑自刎。"无颜见江东父老。"',n:'霸王别姬'},
     {at:3000,t:'张骞出使西域，驼铃声消失在黄沙之中。',n:'凿空西域'}
   ],quote:'秦王扫六合，虎视何雄哉。'},
  {name:'三分天下',era:'三国',sub:'公元220年—280年',dyn:9,
   weather:'sand',spMod:1.12,visMod:0.88,obi:['spear','fire','spear','wall'],
   narrative:[
     {at:400,t:'桃园中，三炷香燃起。刘备、关羽、张飞跪倒在地。',n:'桃园结义'},
     {at:1100,t:'长坂坡，赵云怀抱阿斗，七进七出。白马浴血。',n:'单骑救主'},
     {at:1500,t:'"既生瑜，何生亮。"周瑜的叹息消散在江风中。',n:'既生瑜亮'},
     {at:1900,t:'赤壁。大火映红了江面。曹操看着自己的船队化为灰烬。',n:'火烧赤壁'},
     {at:2800,t:'秋风五丈原。诸葛亮最后一次抬头望天，七星灯缓缓熄灭。',n:'出师未捷'}
   ],quote:'滚滚长江东逝水，浪花淘尽英雄。'},
  {name:'竹林风骨',era:'魏晋南北朝',sub:'公元220年—589年',dyn:10,
   weather:'rain',spMod:1,visMod:0.92,obi:['rock','spear','rock','fire'],
   narrative:[
     {at:500,t:'竹林七贤在竹林中饮酒赋诗，嵇康弹奏《广陵散》。',n:'魏晋风度'},
     {at:1300,t:'嵇康被押往刑场。他看了看日影，要来一张琴。"《广陵散》于今绝矣。"',n:'广陵绝响'},
     {at:1700,t:'陶渊明辞去彭泽县令。"不为五斗米折腰。"归去来兮。',n:'归去来兮'},
     {at:2100,t:'谢安在东山弈棋，淝水之战的捷报放在一旁，纹丝未动。',n:'东山再起'},
     {at:2900,t:'花木兰在黄河边磨刀。十二年戎马，无人知是女郎。',n:'木兰从军'}
   ],quote:'采菊东篱下，悠然见南山。'},
  {name:'盛世华章',era:'隋唐',sub:'公元581年—907年',dyn:3,
   weather:'clear',spMod:1.05,visMod:1,obi:['rock','fire'],
   narrative:[
     {at:500,t:'长安城的灯火照亮了半边天空。繁华如锦，车水马龙。',n:'万国来朝'},
     {at:1300,t:'李白醉倒在长安街头，仰天大笑。月光洒在他的白衣上。',n:'诗仙醉月'},
     {at:1800,t:'杜甫写下"安得广厦千万间，大庇天下寒士俱欢颜"。他自己却住在茅屋中。',n:'诗圣忧民'},
     {at:2200,t:'玄奘背着行囊，一步一步走向西方。"宁向西天一步死。"',n:'西行求法'},
     {at:3200,t:'安史之乱。渔阳鼙鼓动地来，惊破霓裳羽衣曲。',n:'盛世挽歌'}
   ],quote:'九天阊阖开宫殿，万国衣冠拜冕旒。'},
  {name:'水墨江山',era:'两宋',sub:'公元960年—1279年',dyn:4,
   weather:'snow',spMod:1,visMod:1,obi:['rock','spear'],
   narrative:[
     {at:500,t:'苏轼在赤壁江边，写下"大江东去，浪淘尽"。',n:'赤壁怀古'},
     {at:1400,t:'汴京的虹桥上，人来人往。炊烟袅袅，岁月静好。',n:'清明上河'},
     {at:1900,t:'岳飞写下《满江红》。"壮志饥餐胡虏肉，笑谈渴饮匈奴血。"',n:'满江红'},
     {at:2300,t:'李清照独自坐在窗前，窗外下着细雨。"人比黄花瘦。"',n:'声声慢'},
     {at:3200,t:'崖山。陆秀夫背着幼帝跳入海中。十万军民随之赴死。',n:'崖山之后'}
   ],quote:'江山如画，一时多少豪杰。'},
  {name:'十二金牌',era:'南宋·岳飞',sub:'公元1142年',dyn:5,
   weather:'snow',spMod:1,visMod:0.9,obi:['gold_plate','gold_plate','gold_plate','gold_plate','rock'],
   narrative:[
     {at:300,t:'第一道金牌来了。朱仙镇就在前方，但金牌已经到了。',n:'第一道'},
     {at:800,t:'"十年之功，毁于一旦。"岳飞的声音在风雪中颤抖。',n:'十年功废'},
     {at:1200,t:'"文臣不爱钱，武臣不惜死，天下太平矣。"',n:'岳飞之言'},
     {at:1500,t:'第六道金牌。他的白衣上已经有了红色的斑驳。',n:'第六道'},
     {at:2200,t:'第十二道金牌落下。岳飞转过身，看着你。',n:'最后一程'},
     {at:2400,t:'"孩子，谢谢你。但有些事，比生命更重要。"',n:'精忠报国'}
   ],quote:'莫等闲，白了少年头，空悲切。',special:'SnowField'},
  {name:'大漠孤烟',era:'元朝',sub:'公元1271年—1368年',dyn:11,
   weather:'sand',spMod:1.15,visMod:0.8,obi:['spear','fire','spear','rock','fire'],
   narrative:[
     {at:500,t:'成吉思汗的铁骑踏遍欧亚大陆。马鞭所指，皆是疆土。',n:'一代天骄'},
     {at:1400,t:'文天祥被押到大都。忽必烈亲自劝降，他摇头。',n:'留取丹心'},
     {at:1800,t:'关汉卿在大都的戏台上写下《窦娥冤》。"地也，你不分好歹何为地！"',n:'感天动地'},
     {at:2200,t:'马可波罗走在元大都的街道上，目不暇接。"这是世界上最繁华的城市。"',n:'马可波罗'},
     {at:3100,t:'郭守敬站在观星台上，夜风吹动他的白发。他正在计算新的历法。',n:'授时历法'}
   ],quote:'人生自古谁无死，留取丹心照汗青。'},
  {name:'七下西洋',era:'明朝',sub:'公元1405年—1433年',dyn:12,
   weather:'clear',spMod:1.05,visMod:1,obi:['rock','rock','spear','rock','fire'],
   narrative:[
     {at:500,t:'郑和站在宝船的船头。六十艘巨舰遮天蔽日。',n:'扬帆起航'},
     {at:1300,t:'宝船驶过马六甲海峡。海豚在船头跳跃，水手们欢呼。',n:'西洋万里'},
     {at:1700,t:'水手们望着星空。他们不知道，这是中国大航海的最后辉煌。',n:'最后的星空'},
     {at:2000,t:'麒麟（长颈鹿）被牵上船。这将作为礼物献给皇帝。',n:'麒麟来朝'},
     {at:2800,t:'第七次远航。郑和望着远方，目光坚定。"风浪再大，也要走完这条路。"',n:'七下西洋'},
     {at:3200,t:'宝船缓缓沉入海底。大航海时代，中国曾是先行者。',n:'最后的远航'}
   ],quote:'云帆高张，昼夜星驰。',special:'Ocean'},
  {name:'宫墙深重',era:'明清',sub:'公元1368年—1912年',dyn:6,
   weather:'clear',spMod:1.05,visMod:1,obi:['wall','spear','fire'],
   narrative:[
     {at:500,t:'紫禁城的琉璃瓦在阳光下闪烁。九千九百九十九间半。',n:'天子居所'},
     {at:1400,t:'崇祯皇帝在煤山上吊自尽。他给女儿留下了最后一件玩具。',n:'君王死社稷'},
     {at:1900,t:'曹雪芹在贫病中写下《红楼梦》。"满纸荒唐言，一把辛酸泪。"',n:'红楼一梦'},
     {at:2400,t:'郑和下西洋。宝船遮天蔽日，桅杆如林。',n:'七下西洋'},
     {at:3300,t:'林则徐在虎门点燃了第一把火。鸦片在火焰中化为灰烬。',n:'虎门销烟'}
   ],quote:'天子守国门，君王死社稷。'},
  {name:'虎门销烟',era:'晚清',sub:'公元1839年',dyn:13,
   weather:'rain',spMod:1.05,visMod:0.9,obi:['fire','fire','spear','rock','wall','fire'],
   narrative:[
     {at:400,t:'林则徐站在虎门海滩上。两万箱鸦片在他面前堆积如山。',n:'苟利国家'},
     {at:1100,t:'石灰和盐巴倒进池里，鸦片在沸腾中化为污泥。',n:'销烟池'},
     {at:1500,t:'魏源写下"师夷长技以制夷"。但没有人听。',n:'睁眼看世界'},
     {at:1900,t:'英国人的炮舰出现在海平面上。',n:'坚船利炮'},
     {at:2700,t:'第一批不平等条约签署。一个古老帝国开始流血。',n:'百年屈辱'}
   ],quote:'苟利国家生死以，岂因祸福避趋之。'},
  {name:'武昌首义',era:'民国',sub:'公元1911年—1949年',dyn:14,
   weather:'rain',spMod:1.1,visMod:0.88,obi:['wall','spear','fire','spear','rock','fire'],
   narrative:[
     {at:400,t:'武昌城头，一声枪响划破夜空。两千年的帝制，从这一刻开始崩塌。',n:'辛亥枪声'},
     {at:1200,t:'孙中山在南京宣誓就任临时大总统。一个新的国家诞生了。',n:'天下为公'},
     {at:1600,t:'鲁迅在日本看到幻灯片。他放下手术刀，拿起了笔。',n:'弃医从文'},
     {at:2100,t:'五四运动。学生们举着标语走上街头。"外争主权，内除国贼。"',n:'五四风云'},
     {at:3000,t:'卢沟桥的炮声响起。全面抗战开始了。',n:'民族存亡'}
   ],quote:'革命尚未成功，同志仍须努力。'},
  {name:'人间烽火',era:'近现代',sub:'公元1949年',dyn:7,
   weather:'rain',spMod:1.15,visMod:0.9,obi:['fire','fire','wall','spear','rock'],
   narrative:[
     {at:500,t:'甲午海战。邓世昌站在致远舰上。"撞沉吉野！"',n:'此日漫挥'},
     {at:1400,t:'致远舰沉没了。邓世昌拒绝了救援，和他的狗一起沉入大海。',n:'与舰同沉'},
     {at:1900,t:'长征。两万五千里。每一步都踩在死亡的边缘。',n:'长征'},
     {at:2400,t:'辛亥革命的枪声响彻武昌。两千年的帝制，一夜之间崩塌。',n:'武昌首义'},
     {at:3400,t:'1949年10月1日。天安门广场上，五星红旗缓缓升起。',n:'换了人间'}
   ],quote:'为有牺牲多壮志，敢教日月换新天。'},
  {name:'开元盛世',era:'新中国',sub:'公元1949年至今',dyn:15,
   weather:'clear',spMod:1.1,visMod:1,obi:['rock','spear','rock','fire','rock'],
   narrative:[
     {at:500,t:'第一颗原子弹在罗布泊上空爆炸。蘑菇云升起，科研人员抱头痛哭。',n:'两弹一星'},
     {at:1400,t:'东方红一号卫星在太空中播放着《东方红》。',n:'九天揽月'},
     {at:1800,t:'袁隆平在稻田里弯下腰。他要让所有人都吃饱饭。',n:'禾下乘凉'},
     {at:2300,t:'改革开放的春风吹遍了神州大地。深圳速度让世界震惊。',n:'春天故事'},
     {at:3200,t:'高铁在广袤的大地上飞驰。从一个村庄到另一个村庄，只需要一杯茶的时间。',n:'中国速度'},
     {at:3800,t:'神舟飞船冲入太空。五星红旗在宇宙中飘扬。',n:'星辰大海'}
   ],quote:'可上九天揽月，可下五洋捉鳖。'},
  {name:'星河入梦',era:'未来',sub:'逐梦星辰大海',dyn:16,
   weather:'clear',spMod:1.2,visMod:1,obi:['rock','fire','rock','spear','wall','fire'],
   narrative:[
     {at:500,t:'人类在火星上建立了第一座城市。红色的沙漠上，种出了第一株水稻。',n:'火星绿洲'},
     {at:1300,t:'AI和人坐在同一张桌子前讨论哲学。谁创造了谁，已经不那么重要。',n:'万物共生'},
     {at:1700,t:'一个诗人写下："我们从历史中走来，向星辰中走去。"',n:'永恒之路'},
     {at:2100,t:'一个孩子指着星空问："那些星星上有人吗？"',n:'天问'},
     {at:2900,t:'你站在时间的尽头回望。所有的牺牲、所有的选择、所有的改命——都汇成了一束光。',n:'溯世之光'},
     {at:3500,t:'历史不是一条路，而是一棵树。每一次选择，都长出了新的枝桠。',n:'永恒的追问'}
   ],quote:'我们的征途是星辰大海。',special:'StarField'}
];

// ─── 朝代视觉定义 ───
// colors: 主色调（sky天空 skyMid天空中段 fog雾气 ground地面 accent点缀 ink墨色）
// celestial: 天体类型（sun太阳 moon月亮 stars星空）
// decorType: 中景剪影类型（cave洞穴 bronze青铜 greatwall长城 pagoda塔楼 ink水墨 camp军营
//            palace宫殿 ruins废墟 city城市 bamboo竹林 desert沙漠 ship帆船 space太空）
// ambientColor: 氛围粒子颜色  mountainTint: 山脉色调
const DYNASTY_VIS = [
  {colors:{sky:'#0d0d1a',skyMid:'#1a1a2e',ground:'#2a2218',accent:'#cc3300',ink:'#1a1a2a',fog:'#2a2a3a'},
   weather:'rain',bg:'rock',hue:0,name:'鸿蒙初开',
   celestial:'moon',celestialColor:'#c0c8d0',decorType:'cave',
   ambientColor:'#4466aa',mountainTint:'#1a1a2a',
   lightRays:false,cloudTint:'rgba(60,60,90,0.8)',horizonGlow:0.05},
  {colors:{sky:'#1a2418',skyMid:'#2a3a20',ground:'#2a3a1a',accent:'#4a8a3a',ink:'#1a3018',fog:'#2a4028'},
   weather:'clear',bg:'bronze',hue:30,name:'青铜饕餮',
   celestial:'sun',celestialColor:'#a8c080',decorType:'bronze',
   ambientColor:'#88aa44',mountainTint:'#2a3a1a',
   lightRays:true,cloudTint:'rgba(180,220,150,0.6)',horizonGlow:0.12},
  {colors:{sky:'#1a1818',skyMid:'#2a2018',ground:'#3a2018',accent:'#cc2200',ink:'#2a1818',fog:'#3a2820'},
   weather:'sand',bg:'bamboo',hue:10,name:'竹简帛书',
   celestial:'sun',celestialColor:'#cc8844',decorType:'greatwall',
   ambientColor:'#aa8844',mountainTint:'#2a1818',
   lightRays:true,cloudTint:'rgba(200,160,100,0.5)',horizonGlow:0.15},
  {colors:{sky:'#1a1828',skyMid:'#2a2040',ground:'#3a2820',accent:'#e8a020',ink:'#2a1a28',fog:'#4a3850'},
   weather:'clear',bg:'palace',hue:20,name:'盛世华章',
   celestial:'moon',celestialColor:'#e8d080',decorType:'pagoda',
   ambientColor:'#cc88ff',mountainTint:'#2a1a28',
   lightRays:true,cloudTint:'rgba(180,140,220,0.5)',horizonGlow:0.1},
  {colors:{sky:'#e8e0d8',skyMid:'#d0c8c0',ground:'#c8c0b0',accent:'#2a2a2a',ink:'#1a1a1a',fog:'#d8d0c8'},
   weather:'snow',bg:'ink',hue:-15,name:'水墨江山',
   celestial:'sun',celestialColor:'#f0e8d0',decorType:'ink',
   ambientColor:'#888888',mountainTint:'#4a4a4a',
   lightRays:true,cloudTint:'rgba(220,210,200,0.6)',horizonGlow:0.18},
  {colors:{sky:'#0a0a0a',skyMid:'#1a1a1a',ground:'#f0e8d8',accent:'#ffd700',ink:'#000000',fog:'#888888'},
   weather:'snow',bg:'snowfield',hue:-30,name:'十二金牌',
   celestial:'moon',celestialColor:'#c0c0c0',decorType:'camp',
   ambientColor:'#888888',mountainTint:'#2a2a2a',
   lightRays:false,cloudTint:'rgba(80,80,80,0.7)',horizonGlow:0.06},
  {colors:{sky:'#1a1a20',skyMid:'#2a2030',ground:'#4a2020',accent:'#cc8844',ink:'#1a1018',fog:'#3a2a30'},
   weather:'clear',bg:'palace',hue:5,name:'宫墙深重',
   celestial:'moon',celestialColor:'#d0c0a0',decorType:'palace',
   ambientColor:'#aa8844',mountainTint:'#2a1a20',
   lightRays:true,cloudTint:'rgba(100,70,80,0.6)',horizonGlow:0.08},
  {colors:{sky:'#3a3028',skyMid:'#4a3828',ground:'#4a3828',accent:'#cc2200',ink:'#1a1a1a',fog:'#5a4838'},
   weather:'rain',bg:'ruins',hue:0,name:'人间烽火',
   celestial:'sun',celestialColor:'#cc8844',decorType:'ruins',
   ambientColor:'#cc6644',mountainTint:'#3a2820',
   lightRays:true,cloudTint:'rgba(180,140,100,0.5)',horizonGlow:0.14},
  {colors:{sky:'#1a2018',skyMid:'#2a3020',ground:'#2a2a1a',accent:'#6a8a3a',ink:'#1a2a10',fog:'#3a4828'},
   weather:'clear',bg:'bamboo',hue:20,name:'百家争鸣',
   celestial:'sun',celestialColor:'#88aa66',decorType:'bamboo',
   ambientColor:'#88cc44',mountainTint:'#2a2a1a',
   lightRays:true,cloudTint:'rgba(140,200,120,0.5)',horizonGlow:0.12},
  {colors:{sky:'#1a1410',skyMid:'#2a2018',ground:'#3a2010',accent:'#cc4400',ink:'#2a1008',fog:'#4a2818'},
   weather:'sand',bg:'rock',hue:5,name:'三分天下',
   celestial:'sun',celestialColor:'#cc6633',decorType:'camp',
   ambientColor:'#cc4422',mountainTint:'#2a1008',
   lightRays:true,cloudTint:'rgba(200,120,80,0.5)',horizonGlow:0.15},
  {colors:{sky:'#182218',skyMid:'#283020',ground:'#283020',accent:'#5a8a5a',ink:'#1a2818',fog:'#384838'},
   weather:'rain',bg:'bamboo',hue:15,name:'竹林风骨',
   celestial:'moon',celestialColor:'#a0c0a0',decorType:'bamboo',
   ambientColor:'#66aa66',mountainTint:'#283020',
   lightRays:true,cloudTint:'rgba(100,180,100,0.5)',horizonGlow:0.08},
  {colors:{sky:'#201510',skyMid:'#3a2818',ground:'#3a2810',accent:'#cc8830',ink:'#2a1008',fog:'#5a3818'},
   weather:'sand',bg:'ruins',hue:5,name:'大漠孤烟',
   celestial:'sun',celestialColor:'#ffaa44',decorType:'desert',
   ambientColor:'#cc8833',mountainTint:'#3a2810',
   lightRays:true,cloudTint:'rgba(220,180,100,0.4)',horizonGlow:0.18},
  {colors:{sky:'#101830',skyMid:'#182848',ground:'#1a2840',accent:'#3068c0',ink:'#0a1028',fog:'#203050'},
   weather:'clear',bg:'palace',hue:25,name:'七下西洋',
   celestial:'moon',celestialColor:'#a0c0ff',decorType:'ship',
   ambientColor:'#4488cc',mountainTint:'#1a2840',
   lightRays:true,cloudTint:'rgba(100,140,220,0.5)',horizonGlow:0.1},
  {colors:{sky:'#282018',skyMid:'#382818',ground:'#382818',accent:'#cc4400',ink:'#1a1008',fog:'#483020'},
   weather:'rain',bg:'ruins',hue:0,name:'虎门销烟',
   celestial:'sun',celestialColor:'#cc4422',decorType:'ruins',
   ambientColor:'#cc4422',mountainTint:'#382818',
   lightRays:true,cloudTint:'rgba(180,100,80,0.5)',horizonGlow:0.12},
  {colors:{sky:'#1a1820',skyMid:'#282030',ground:'#382820',accent:'#cc2222',ink:'#181020',fog:'#483830'},
   weather:'rain',bg:'rock',hue:0,name:'武昌首义',
   celestial:'moon',celestialColor:'#c0b0c0',decorType:'city',
   ambientColor:'#cc2222',mountainTint:'#282828',
   lightRays:false,cloudTint:'rgba(100,60,80,0.6)',horizonGlow:0.06},
  {colors:{sky:'#101830',skyMid:'#182840',ground:'#282830',accent:'#d04030',ink:'#101020',fog:'#303845'},
   weather:'clear',bg:'palace',hue:20,name:'开元盛世',
   celestial:'sun',celestialColor:'#ffe080',decorType:'city',
   ambientColor:'#d04030',mountainTint:'#282830',
   lightRays:true,cloudTint:'rgba(160,140,180,0.5)',horizonGlow:0.14},
  {colors:{sky:'#050510',skyMid:'#0a0a20',ground:'#0a0a20',accent:'#4060ff',ink:'#000010',fog:'#101530'},
   weather:'clear',bg:'ink',hue:40,name:'星河入梦',
   celestial:'stars',celestialColor:'#8888ff',decorType:'space',
   ambientColor:'#4466ff',mountainTint:'#0a0a20',
   lightRays:true,cloudTint:'rgba(40,40,100,0.6)',horizonGlow:0.08}
];
