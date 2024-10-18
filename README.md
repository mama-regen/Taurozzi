# Taurozzi

### A Typescript 3D engine.

## Use

Splash screen can be replaced by changing `images/logo.png` to a different 500x500 png image.
Textures should all go in the `images` folder. The program reads `obj` files from the `3d_models` directory. Textures can either be included in the `obj` file with the line `usemtl your_material_name_here` or by specifying the texture name in the level json. You can also paint the objects solid colors by setting the `texture` property to an array of `[Red, Green, Blue]` with an optional 4th entry for alpha. Lighting is calculated up front, so if your objects move they will keep their lighting. Lights are specified in the level json by location and falloff. The falloff is `[starts_to_dim, fully_dim]` with a smooth gradient in between. Lighting is calculated per tri. Other settings can be found in settings.json, which apply to every level.

----

__Author:__ Gary McKnight

__Thanks:__ Jaxidx9. Adapted from the [3D Graphics Engine Tutorial.](https://www.youtube.com/watch?v=ih20l3pJoeU)