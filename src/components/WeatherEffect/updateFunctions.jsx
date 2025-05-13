// src/components/WeatherEffect/updateFunctions.js
// Sun position updater based on time of day
export const updateSunPosition = (modelsRef, getTimeOfDay) => {
  if (!modelsRef.sun) return;
  
  const currentTime = getTimeOfDay();
  const sun = modelsRef.sun;
  const timeInSeconds = Date.now() * 0.0001;

  if (currentTime === 'dawn') {
    sun.position.set(20, 10, -50);
    sun.position.x += Math.sin(timeInSeconds * 0.2) * 2;
    sun.position.y += Math.sin(timeInSeconds * 0.5) * 0.5;
  } else if (currentTime === 'day') {
    sun.position.set(0, 20, -50);
    sun.position.x += Math.sin(timeInSeconds * 0.1) * 5;
    sun.position.y = 20 + Math.sin(timeInSeconds * 0.2) * 2;
  } else if (currentTime === 'dusk') {
    sun.position.set(-20, 10, -50);
    sun.position.x += Math.sin(timeInSeconds * 0.2) * 2;
    sun.position.y += Math.sin(timeInSeconds * 0.5) * 0.5;
  } else {
    sun.visible = false;
    return;
  }
  
  sun.visible = true;
};

// Update cloud positions
export const updateClouds = (clouds) => {
  if (!clouds || !Array.isArray(clouds)) return;
  
  clouds.forEach((cloud) => {
    // Reduce movement frequency to improve performance
    cloud.position.x -= 0.02;
    if (cloud.position.x < -100) {
      cloud.position.x = 100;
      cloud.position.z = -60 + Math.random() * 40;
    }
    
    // Use less frequent vertical movement
    if (Math.random() < 0.01) {
      cloud.position.y += (Math.random() - 0.5) * 0.05;
    }
  });
};

// Update raindrop positions
export const updateRaindrops = (raindrops) => {
  if (!raindrops || !Array.isArray(raindrops)) return;
  
  raindrops.forEach((raindrop) => {
    raindrop.model.position.y -= raindrop.velocity;
    if (raindrop.model.position.y < -22.5) {
      raindrop.model.position.y = raindrop.startY;
      raindrop.model.position.x = (Math.random() - 0.5) * 20;
      raindrop.model.position.z = raindrop.startZ;
    }
  });
};

// Update snowflake positions
export const updateSnowflakes = (snowflakes) => {
  if (!snowflakes || !Array.isArray(snowflakes)) return;
  
  snowflakes.forEach((snowflake) => {
    snowflake.model.position.y -= snowflake.velocity;
    
    // Reduce sine movement frequency
    if (Math.random() < 0.1) {
      snowflake.model.position.x += (Math.random() - 0.5) * 0.05;
    }
    
    // Reduce rotation frequency
    snowflake.model.rotation.x += snowflake.rotationSpeed.x * 0.5;
    snowflake.model.rotation.y += snowflake.rotationSpeed.y * 0.5;
    snowflake.model.rotation.z += snowflake.rotationSpeed.z * 0.5;
    
    if (snowflake.model.position.y < -22.5) {
      snowflake.model.position.y = snowflake.startY;
      snowflake.model.position.x = (Math.random() - 0.5) * 20;
      snowflake.model.position.z = snowflake.startZ;
    }
  });
};

// Combined model updater function
export const updateAllModels = (modelsRef) => {
  updateClouds(modelsRef.clouds);
  updateRaindrops(modelsRef.raindrops);
  updateSnowflakes(modelsRef.snowflakes);
};