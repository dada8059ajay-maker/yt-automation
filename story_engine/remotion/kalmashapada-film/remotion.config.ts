import {Config} from '@remotion/cli/config';

// JPEG stills are faster to encode than PNG for this dark, painterly scene.
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
