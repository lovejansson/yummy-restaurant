export default class ImagesManager {

    /**
     * @type {Map<string, HTMLImageElement>}
     * @description A map that stores images, where the key is the image name and the value is the corresponding HTMLImageElement.
     */
    images;

    /**
     * @type {Map<string, string>}
     * @description A map that stores the paths of images, where the key is the image name and the value is the path.
     */
    #paths;


    constructor() {
        this.images = new Map();
        this.#paths = new Map();
    }

    /**
     * Adds an image.
     * 
     * @param {string} name The name of the image.
     * @param {string} path The path for the image.
     */
    add(name, path) {
        this.#paths.set(name, path);
    }

    /**
     * Loads all images that have been added. Each added image will be fetched from its path.
     * 
     * @returns {Promise<void>} A promise that resolves once all images are successfully loaded.
     */
    async load() {
        /**
         * @type {Promise<[string, HTMLImageElement][]>}
         * @description An array of promises that resolve to an array containing the image name and its corresponding image.
         */
        const loadPromises = [];

        for (const [name, path] of this.#paths.entries()) {
            const image = new Image();
    
            const loadPromise = new Promise((resolve, reject) => {
                image.addEventListener("load", () => {
                    resolve([name, image]);
                });

                image.addEventListener("error", (e) => {
                    reject(new LoadimageError(name, path, e.error));
                });
            });

            image.src = path;
            loadPromises.push(loadPromise);
        }

        try {
            const loadedimages = await Promise.all(loadPromises);
            this.images = new Map(loadedimages);
        } catch (e) {
            throw e;
        }
    }

    /**
     * Retrieves the image element associated with a given image name.
     * 
     * @param {string} name The name of the image.
     * @returns {HTMLImageElement} The image element corresponding to the image name.
     * @throws {ImageNotLoadedError} Throws an error if the image has not been loaded.
     */
    get(name) {
        const image = this.images.get(name);

        if (!image) throw new ImageNotLoadedError(name);

        return image;
    }
}

/**
 * Custom error thrown when an image is requested but has not been loaded.
 */
class ImageNotLoadedError extends Error {
    /**
     * @param {string} imageName The name of the image that was not loaded.
     */
    constructor(imageName) {
        super(`image: ${imageName} not loaded`);
    }
}

/**
 * Custom error thrown when there is a failure to load an image.
 */
class LoadimageError extends Error {
    /**
     * @param {string} name The name of the image that failed to load.
     * @param {string} path The path for the image.
     * @param {string} inner The inner error message.
     */
    constructor(name, path, inner) {
        super(`Failed to load image: ${name} at: ${path} bc: ${inner}`);
    }
}