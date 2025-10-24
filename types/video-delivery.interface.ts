export interface VideoDeliveryResource {
  uri: string;
  url: string;
  qualityLevel: number;
  qualityLevelParams: {
    level: string;
  };
  mimeType: string;
  order: number;
  height: number;
  width: number;
  enabled?: boolean;
}

export interface VideoDeliveryGroup {
  id: string;
  label: string;
  origins: {
    id: string;
    url: string;
    label: string;
  }[];
  variants: VideoDeliveryResource[];
}

export interface VideoDelivery {
  groups: VideoDeliveryGroup[];
}
