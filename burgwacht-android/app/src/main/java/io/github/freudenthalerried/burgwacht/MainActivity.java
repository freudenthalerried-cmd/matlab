package io.github.freudenthalerried.burgwacht;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebViewAssetLoader;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/** Zeigt das Spiel in einer WebView und verbindet es mit AdMob und Google Play Billing. */
public class MainActivity extends AppCompatActivity {
    private static final String HOST = "appassets.androidplatform.net";
    private WebView web;
    private ConsentInformation consent;
    private final AtomicBoolean adsStarted = new AtomicBoolean(false);
    private RewardedAd rewarded;
    private InterstitialAd interstitial;
    private BillingClient billing;
    private ProductDetails product;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat bars = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        bars.hide(WindowInsetsCompat.Type.systemBars());
        bars.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);

        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        // Systemschriftgröße nicht übernehmen, sonst läuft das Layout über den Bildschirmrand
        s.setTextZoom(100);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);

        WebViewAssetLoader assets = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assets.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (HOST.equals(uri.getHost())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception ignored) {
                }
                return true;
            }
        });
        web.addJavascriptInterface(new Bridge(), "BWNative");
        web.loadUrl("https://" + HOST + "/assets/game/index.html");

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                web.evaluateJavascript("window.bwBack?bwBack():false", v -> {
                    if (!"true".equals(v)) finish();
                });
            }
        });

        startConsentAndAds();
        startBilling();
    }

    @Override
    protected void onPause() {
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    protected void onDestroy() {
        if (billing != null) billing.endConnection();
        web.destroy();
        super.onDestroy();
    }

    private void js(String code) {
        runOnUiThread(() -> web.evaluateJavascript(code, null));
    }

    // ---------- Einwilligung und Werbung ----------
    private void startConsentAndAds() {
        consent = UserMessagingPlatform.getConsentInformation(this);
        consent.requestConsentInfoUpdate(this, new ConsentRequestParameters.Builder().build(),
                () -> UserMessagingPlatform.loadAndShowConsentFormIfRequired(this, error -> {
                    if (consent.canRequestAds()) initAds();
                }),
                error -> {
                    if (consent.canRequestAds()) initAds();
                });
        if (consent.canRequestAds()) initAds();
    }

    private void initAds() {
        if (adsStarted.getAndSet(true)) return;
        MobileAds.initialize(this, status -> {
            loadRewarded();
            loadInterstitial();
        });
    }

    private void loadRewarded() {
        RewardedAd.load(this, BuildConfig.AD_REWARDED, new AdRequest.Builder().build(), new RewardedAdLoadCallback() {
            @Override
            public void onAdLoaded(@NonNull RewardedAd ad) {
                rewarded = ad;
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError error) {
                rewarded = null;
            }
        });
    }

    private void loadInterstitial() {
        InterstitialAd.load(this, BuildConfig.AD_INTERSTITIAL, new AdRequest.Builder().build(), new InterstitialAdLoadCallback() {
            @Override
            public void onAdLoaded(@NonNull InterstitialAd ad) {
                interstitial = ad;
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError error) {
                interstitial = null;
            }
        });
    }

    private void showRewarded() {
        if (rewarded == null) {
            js("window.bwAdDone&&bwAdDone(false)");
            loadRewarded();
            return;
        }
        final boolean[] earned = {false};
        RewardedAd ad = rewarded;
        rewarded = null;
        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                js("window.bwAdDone&&bwAdDone(" + earned[0] + ")");
                loadRewarded();
            }

            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError error) {
                js("window.bwAdDone&&bwAdDone(false)");
                loadRewarded();
            }
        });
        ad.show(this, reward -> earned[0] = true);
    }

    private void showInterstitial() {
        if (interstitial == null) {
            js("window.bwAdDone&&bwAdDone(false)");
            loadInterstitial();
            return;
        }
        InterstitialAd ad = interstitial;
        interstitial = null;
        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                js("window.bwAdDone&&bwAdDone(true)");
                loadInterstitial();
            }

            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError error) {
                js("window.bwAdDone&&bwAdDone(false)");
                loadInterstitial();
            }
        });
        ad.show(this);
    }

    // ---------- Google Play Billing ----------
    private void startBilling() {
        billing = BillingClient.newBuilder(this)
                .setListener((result, purchases) -> {
                    if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
                        for (Purchase p : purchases) handlePurchase(p);
                    } else if (result.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
                        restorePurchases();
                    }
                })
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .build();
        connectBilling(this::onBillingReady);
    }

    private void connectBilling(Runnable then) {
        if (billing.isReady()) {
            then.run();
            return;
        }
        billing.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) then.run();
            }

            @Override
            public void onBillingServiceDisconnected() {
            }
        });
    }

    private void onBillingReady() {
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(BuildConfig.PRODUCT_ID)
                        .setProductType(BillingClient.ProductType.INAPP)
                        .build()))
                .build();
        billing.queryProductDetailsAsync(params, (result, details) -> {
            List<ProductDetails> list = details.getProductDetailsList();
            if (list != null && !list.isEmpty()) product = list.get(0);
        });
        restorePurchases();
    }

    private void restorePurchases() {
        connectBilling(() -> billing.queryPurchasesAsync(
                QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),
                (result, purchases) -> {
                    for (Purchase p : purchases) handlePurchase(p);
                }));
    }

    private void handlePurchase(Purchase p) {
        if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED || !p.getProducts().contains(BuildConfig.PRODUCT_ID)) return;
        js("window.bwPremium&&bwPremium()");
        if (!p.isAcknowledged()) {
            billing.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.getPurchaseToken()).build(), r -> {
            });
        }
    }

    private void buy() {
        if (product == null) {
            js("toast(tr('Kauf gerade nicht möglich'))");
            return;
        }
        BillingFlowParams flow = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(Collections.singletonList(
                        BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product).build()))
                .build();
        billing.launchBillingFlow(this, flow);
    }

    /** Wird im Spiel als window.BWNative angesprochen. */
    private class Bridge {
        @JavascriptInterface
        public void showAd(String type) {
            runOnUiThread(() -> {
                if ("rewarded".equals(type)) showRewarded();
                else showInterstitial();
            });
        }

        @JavascriptInterface
        public boolean canBuy() {
            return product != null;
        }

        @JavascriptInterface
        public String price() {
            ProductDetails p = product;
            if (p == null || p.getOneTimePurchaseOfferDetails() == null) return "";
            return p.getOneTimePurchaseOfferDetails().getFormattedPrice();
        }

        @JavascriptInterface
        public void buy() {
            runOnUiThread(MainActivity.this::buy);
        }

        @JavascriptInterface
        public void restore() {
            runOnUiThread(MainActivity.this::restorePurchases);
        }

        @JavascriptInterface
        public boolean hasPrivacyOptions() {
            return consent != null && consent.getPrivacyOptionsRequirementStatus()
                    == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED;
        }

        @JavascriptInterface
        public void privacyOptions() {
            runOnUiThread(() -> UserMessagingPlatform.showPrivacyOptionsForm(MainActivity.this, error -> {
            }));
        }
    }
}
