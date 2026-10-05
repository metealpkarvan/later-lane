# Later Lane

Kaydedilen yazılar ve gönderiler için üç parçalık okuma tepsisi. Bir niyet ve tahmini süre ekle, zaman bütçeni seç ve okuduğundan kalan fikri kaydet.

[Canlı uygulama](https://metealpkarvan.github.io/later-lane/) · [İndir](https://github.com/metealpkarvan/later-lane/releases/latest) · [English](README.md)

![Çalışan arayüz](docs/desktop.png)

## Özellikler

- Her bağlantıya okuma niyeti, tahmini süre, öncelik ve isteğe bağlı yeniden düşünme tarihi.
- 1–90 dakikalık bütçeye sığan en fazla üç içerikten oluşan, açıklanabilir tepsi.
- Okudum, niyeti bırak, süreyi uzat ve kutuya geri al akışları; tarih geçince içerik silinmez.
- Türkçe arama, kayıt düzenleme, tek cümlelik çıkarım, Markdown ve JSON yedekleri.

## Başla

1. **Örnek** ile kurgusal dört bağlantılık kutuyu dene.
2. Başlık, HTTP(S) bağlantı, okuma niyeti ve tahmini dakikayı gir.
3. Zamanını seç. Tepsiden özgün sayfayı aç; okuduğunda işaretle ve dilersen bir çıkarım yaz.
4. Tarihi geçen niyetleri yeniden düşün; kayıtları silmeden bırak veya uzat.

İndirilen ZIP'i çıkarıp **index.html** dosyasını güncel tarayıcında açabilirsin. Paket hazırlanmış JavaScript içerir; Node.js, sunucu veya API anahtarı gerekmez. Canlı uygulama daha öngörülebilir tarayıcı kaydı sağlar. İndirilen klasörü taşımadan veya canlı uygulamaya geçmeden önce JSON yedeğini indir; `file:` sayfalarının yerel kayıt davranışı tarayıcıya ve konuma göre değişebilir.

## Veriler ve sınırlar

En fazla 100 elle girilen kayıt. Süre ve öncelik tahminleri sana aittir. Tepsi puanı öncelik × 100 + en fazla 30 bekleme günüdür; eşitlikte önce daha fazla içerik, sonra daha kısa süre, sonra kayıt sırası seçilir. Tarihi geçenler yenilenene kadar tepsi dışında kalır. Özgün yazılar indirilmez, özetlenmez veya önbelleğe alınmaz. X/Reddit yer imleri içe aktarılmaz. Zaman bütçesi yeniden açılışta varsayılana döner.

Kayıtların bu tarayıcıda saklanır ve şifreli değildir. Hesap, bulut eşitleme, analitik veya AI API çağrısı yoktur. Tarayıcı verilerini silmek kayıtları da silebilir. Bozuk kayıt üzerine yazma engellenir; orijinal kaydı indirme seçeneği vardır. Yedek yüklemeden önce içerik doğrulanır ve onaydan sonra mevcut verilerin kurtarma kopyası indirilir. JSON içe aktarımı 3 MB ile sınırlıdır.

Canlı uygulama ilk çevrimiçi açılıştan sonra arayüzünü çevrimdışı açabilir. Bağlantı verdiğin siteler önbelleğe alınmaz. Türkçe/İngilizce geçişi düğmeleri çevirir; senin yazdığın içerikleri değiştirmez.

## Araştırma ve doğrulama

5 Ekim 2026'da erişilen üç X gönderisi ve sekiz Reddit tartışmasından türetilen tasarım varsayımları [araştırma kaydında](docs/COMMUNITY-RESEARCH-2026-10-05.md) açıklanır. Eksik X metinleri, tarih belirsizliği ve ürün tanıtımı içeren kaynaklar açıkça işaretlidir. Kullanıcı testiyle ölçülmüş fayda veya toplumun tamamına dair genelleme yoktur.

**39 otomatik kural/paket kontrolü**, gerçek tarayıcı kullanım akışları, mobil görünüm ve çevrimdışı açılış kontrol edildi. CI, Intel ve Apple Silicon üzerinde yerel Node.js ile çalışır. Uygulama her iki Mac türünde modern tarayıcıyla açılır; Rosetta gerekmez. Geliştirme için Node.js 22+, isteğe bağlı yerel sunucu için Python 3 kullanılır.

MIT · Mete Alp Karvan
