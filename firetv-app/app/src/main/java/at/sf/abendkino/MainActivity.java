package at.sf.abendkino;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;

public class MainActivity extends Activity {

    private static final String UA =
            "Mozilla/5.0 (Linux; Android 9; AFTMM) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

    // Normal mode: block well-known ad / tracking networks.
    private static final Pattern AD_HOSTS = Pattern.compile(
            "(exoclick|exosrv|exdynsrv|trafficjunky|trafficfactory|juicyads|popads|popcash|propeller|adnxs|"
                    + "doubleclick|googlesyndication|googletagmanager|google-analytics|adtng|tsyndicate|realsrv|"
                    + "magsrv|ad-maven|clickadu|hilltopads|trafficstars|adspyglass|adsterra|onclick|pushnami|"
                    + "dtscout|mgid|taboola|outbrain|syndication|popunder|adserver|^ads?\\.|\\.ads?\\.)");
    private static final Pattern MEDIA = Pattern.compile("\\.(mp4|m3u8|ts|m4s|webm)(\\?|$)");

    private FrameLayout root;
    private WebView ui;
    private WebView player;
    private SharedPreferences prefs;
    private final ExecutorService pool = Executors.newFixedThreadPool(4);
    private String playingId = "";
    private volatile boolean strict = true;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        prefs = getSharedPreferences("ak", MODE_PRIVATE);
        strict = !"0".equals(prefs.getString("strict", "1"));

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        ui = new WebView(this);
        setup(ui);
        ui.getSettings().setAllowFileAccess(true);
        ui.addJavascriptInterface(new Bridge(), "Android");
        ui.setWebViewClient(new WebViewClient());
        root.addView(ui, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        ui.loadUrl("file:///android_asset/index.html");
        ui.requestFocus();
    }

    private void setup(WebView w) {
        w.setBackgroundColor(Color.BLACK);
        WebSettings s = w.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setUserAgentString(UA);
    }

    private WebView player() {
        if (player != null) return player;
        player = new WebView(this);
        setup(player);
        player.getSettings().setSupportMultipleWindows(true); // popups go to onCreateWindow -> dropped
        player.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
        player.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onCreateWindow(WebView v, boolean d, boolean g, android.os.Message m) {
                return false;
            }
        });
        player.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return blocked(r.getUrl()) ? empty() : null;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                String h = u.getHost() == null ? "" : u.getHost();
                // only the embed player may load, every click-through is swallowed
                return !(h.endsWith("eporner.com") && u.getPath() != null && u.getPath().startsWith("/embed/"));
            }

            @Override
            public void onPageFinished(WebView v, String url) {
                v.evaluateJavascript(asset("inject.js"), null);
            }
        });
        player.setVisibility(View.GONE);
        root.addView(player, new FrameLayout.LayoutParams(-1, -1));
        return player;
    }

    private boolean blocked(Uri u) {
        String h = u.getHost() == null ? "" : u.getHost().toLowerCase();
        String url = u.toString().toLowerCase();
        if (MEDIA.matcher(url).find()) return false;
        if (strict) {
            return !(h.endsWith("eporner.com") || h.endsWith("cdnjs.cloudflare.com")
                    || h.endsWith("ajax.googleapis.com") || h.endsWith("jsdelivr.net"));
        }
        return AD_HOSTS.matcher(h).find();
    }

    private static WebResourceResponse empty() {
        return new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));
    }

    private String asset(String name) {
        try (InputStream in = getAssets().open(name)) {
            return new String(read(in), "UTF-8");
        } catch (Exception e) {
            return "";
        }
    }

    private static byte[] read(InputStream in) throws java.io.IOException {
        ByteArrayOutputStream o = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) > 0) o.write(buf, 0, n);
        return o.toByteArray();
    }

    private void openPlayer(String url, String id) {
        playingId = id;
        WebView p = player();
        p.onResume();
        p.loadUrl(url);
        p.setVisibility(View.VISIBLE);
        p.requestFocus();
    }

    private void closePlayer() {
        player.evaluateJavascript("window.__pos?window.__pos():0", v -> {
            int sec = 0;
            try { sec = (int) Double.parseDouble(v); } catch (Exception ignored) { }
            player.loadUrl("about:blank");
            player.onPause();
            player.setVisibility(View.GONE);
            ui.requestFocus();
            ui.evaluateJavascript("onPlayerClosed(" + JSONObject.quote(playingId) + "," + sec + ")", null);
        });
    }

    private boolean playerVisible() {
        return player != null && player.getVisibility() == View.VISIBLE;
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        int k = e.getKeyCode();
        if (playerVisible()) {
            if (e.getAction() != KeyEvent.ACTION_DOWN) return true;
            String c = null;
            switch (k) {
                case KeyEvent.KEYCODE_BACK: closePlayer(); return true;
                case KeyEvent.KEYCODE_DPAD_CENTER: case KeyEvent.KEYCODE_ENTER:
                case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE: case KeyEvent.KEYCODE_MEDIA_PLAY:
                case KeyEvent.KEYCODE_MEDIA_PAUSE: c = "toggle"; break;
                case KeyEvent.KEYCODE_DPAD_RIGHT: case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD: c = "fwd"; break;
                case KeyEvent.KEYCODE_DPAD_LEFT: case KeyEvent.KEYCODE_MEDIA_REWIND: c = "back"; break;
                case KeyEvent.KEYCODE_DPAD_UP: c = "ffwd"; break;
                case KeyEvent.KEYCODE_DPAD_DOWN: c = "fback"; break;
                default: return super.dispatchKeyEvent(e);
            }
            player.evaluateJavascript("window.__ctl&&window.__ctl('" + c + "')", null);
            return true;
        }
        if (k == KeyEvent.KEYCODE_BACK) {
            if (e.getAction() == KeyEvent.ACTION_DOWN)
                ui.evaluateJavascript("onBack()", v -> { if (!"true".equals(v)) finish(); });
            return true;
        }
        if (k == KeyEvent.KEYCODE_MENU) {
            if (e.getAction() == KeyEvent.ACTION_DOWN) ui.evaluateJavascript("onMenu()", null);
            return true;
        }
        return super.dispatchKeyEvent(e);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (playerVisible()) player.evaluateJavascript("window.__ctl&&window.__ctl('pause')", null);
    }

    public class Bridge {
        @JavascriptInterface
        public String load(String key) { return prefs.getString(key, ""); }

        @JavascriptInterface
        public void save(String key, String val) {
            prefs.edit().putString(key, val).apply();
            if ("strict".equals(key)) strict = !"0".equals(val);
        }

        @JavascriptInterface
        public void get(final String url, final String cb) {
            pool.execute(() -> {
                boolean ok = false;
                String body;
                try {
                    HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                    c.setConnectTimeout(8000);
                    c.setReadTimeout(12000);
                    c.setRequestProperty("User-Agent", UA);
                    try (InputStream in = c.getInputStream()) { body = new String(read(in), "UTF-8"); }
                    ok = c.getResponseCode() == 200;
                } catch (Exception ex) {
                    body = String.valueOf(ex.getMessage());
                }
                final String js = "__cb(" + JSONObject.quote(cb) + "," + ok + "," + JSONObject.quote(body) + ")";
                runOnUiThread(() -> ui.evaluateJavascript(js, null));
            });
        }

        @JavascriptInterface
        public void play(final String url, final String id) { runOnUiThread(() -> openPlayer(url, id)); }

        @JavascriptInterface
        public void keyboard() {
            runOnUiThread(() -> {
                InputMethodManager im = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
                im.showSoftInput(ui, InputMethodManager.SHOW_IMPLICIT);
            });
        }

        @JavascriptInterface
        public void exit() { runOnUiThread(MainActivity.this::finish); }
    }
}
