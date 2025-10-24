declare module '@mux/mux-data-react-native-video' {
  import { ComponentType } from 'react';
  import { VideoProperties } from 'react-native-video';

  export interface MuxOptions {
    // Required: Your Mux environment key
    envKey?: string;

    // Required: Application name
    application_name: string;
    application_version?: string;

    // Player metadata
    player_name?: string;
    player_version?: string;
    player_init_time?: number;

    // Video metadata
    video_id?: string;
    video_title?: string;
    video_series?: string;
    video_producer?: string;
    video_stream_type?: 'live' | 'on-demand';
    video_duration?: number;
    video_cdn?: string;

    // Viewer metadata
    viewer_user_id?: string;
    viewer_application_name?: string;
    viewer_application_version?: string;
    viewer_device_name?: string;
    viewer_device_category?: string;
    viewer_os_family?: string;
    viewer_os_version?: string;

    // Data object for additional metadata
    data?: {
      env_key?: string;
      video_id?: string;
      video_title?: string;
      video_series?: string;
      video_producer?: string;
      [key: string]: string | number | boolean | undefined;
    };

    // Debug mode
    debug?: boolean;

    // Additional custom metadata
    [key: string]: string | number | boolean | undefined;
  }

  // The package exports a HOC wrapper function as default
  function withMux<T extends VideoProperties>(Component: ComponentType<T>): ComponentType<T & { muxOptions?: MuxOptions }>;
  export default withMux;
}
