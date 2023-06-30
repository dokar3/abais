export type Model = {
  apiName: string;
  humanName: string;
  available: boolean;
};

export namespace Model {
  export namespace Text {
    export const GPT_35_Turbo: Model = {
      apiName: "gpt-3.5-turbo",
      humanName: "GPT 3.5 Turbo",
      available: true,
    };

    export const GPT_4: Model = {
      apiName: "gpt-4",
      humanName: "GPT 4",
      available: process.env.NEXT_PUBLIC_GPT_4_AVAILABLE === "true",
    };

    export const All = [GPT_35_Turbo, GPT_4];

    export function findByApiName(apiName: string): Model | null {
      return All.find((item) => item.apiName === apiName) ?? null;
    }
  }

  export namespace Image {
    export const StableDiffusion_1_4: Model = {
      apiName: "CompVis/stable-diffusion-v1-4",
      humanName: "Stable Diffusion 1.4",
      available: true,
    };

    export const StableDiffusion_1_5: Model = {
      apiName: "runwayml/stable-diffusion-v1-5",
      humanName: "Stable Diffusion 1.5",
      available: true,
    };

    export const StableDiffusion_2_1: Model = {
      apiName: "stabilityai/stable-diffusion-2-1",
      humanName: "Stable Diffusion 2.1",
      available: true,
    };

    export const StableDiffusion_2_1_Base: Model = {
      apiName: "stabilityai/stable-diffusion-2-1-base",
      humanName: "Stable Diffusion 2.1 Base",
      available: true,
    };

    export const StableDiffusion_Herge_Style: Model = {
      apiName: "sd-dreambooth-library/herge-style",
      humanName: "Stable Diffusion Herge Style",
      available: true,
    };

    export const All = [
      StableDiffusion_1_4,
      StableDiffusion_1_5,
      StableDiffusion_2_1,
      StableDiffusion_2_1_Base,
      StableDiffusion_Herge_Style,
    ];

    export function findByApiName(apiName: string): Model | null {
      return All.find((item) => item.apiName === apiName) ?? null;
    }
  }
}
