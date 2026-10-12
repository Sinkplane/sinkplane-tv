// Adopt the UIKit scene lifecycle on iOS/tvOS 27+, which asserts at launch
// unless the app adopts scene-based lifecycle. Uses Expo's ExpoAppSceneDelegate
// (shipped in the `expo` pod) to host the React Native root view in a UIWindowScene.
//
// 1. Adds UIApplicationSceneManifest to Info.plist.
// 2. Replaces the prebuild AppDelegate.swift template with a scene-adopting variant.
//
// Drop this plugin when the Expo template adopts scenes natively.
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const APP_DELEGATE_SWIFT = `internal import Expo
import React
import ReactAppDependencyProvider

@main
class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    // The window and React root view are created by ExpoAppSceneDelegate
    // in the scene-based life cycle (required by iOS/tvOS 27).

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Scene life cycle adoption (required by iOS/tvOS 27)
  public func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    let configuration = UISceneConfiguration(name: nil, sessionRole: connectingSceneSession.role)
    configuration.delegateClass = ExpoAppSceneDelegate.self
    return configuration
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
`;

function withSceneLifecycleAppDelegate (config) {
  return withAppDelegate(config, (props) => {
    props.modResults.language = 'swift';
    props.modResults.contents = APP_DELEGATE_SWIFT;
    return props;
  });
}

function withSceneManifest (config) {
  return withInfoPlist(config, (props) => {
    props.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
    };
    return props;
  });
}

module.exports = function withTVSceneLifecycle (config) {
  config = withSceneManifest(config);
  config = withSceneLifecycleAppDelegate(config);
  return config;
};
