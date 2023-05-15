import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

let scene, camera, renderer, controls;
let geometry, material, mesh;
let blocks = [];
let speed = 0.1;  // Set the speed of the camera movement
let canInteract = false;
let velocity = new THREE.Vector3(); // 플레이어의 속도를 저장하는 벡터
let canJump = false; // 플레이어가 점프할 수 있는지를 결정하는 변수

let keys = {
  forward: false,
  backward: false,
  left: false,
  right: false
};

init();
animate();

function init() {
    scene = new THREE.Scene();
    const WIDTH = window.innerWidth, HEIGHT = window.innerHeight;

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(WIDTH, HEIGHT);
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 20000);
    camera.position.set(0,6,10);
    camera.lookAt(scene.position);
    scene.add(camera);

    // Add PointerLockControls
    controls = new PointerLockControls(camera, renderer.domElement);
    scene.add(controls.getObject());

    let light = new THREE.PointLight(0xffffff);
    let ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);
    light.position.set(-100,200,100);
    scene.add(light);

    // Define the material for the blocks
    material = new THREE.MeshPhongMaterial({color: 0x1ec876});

    // Create and place blocks in a grid
    for(let x = -5; x <= 5; x++) {
        for(let z = -5; z <= 5; z++) {
            createBlock(x, 0, z);
        }
    }

    controls.addEventListener('lock', function () {
        // controls가 잠겨 있을 때만 블록을 설치하거나 파괴할 수 있습니다.
        canInteract = true;
    });
    
    controls.addEventListener('unlock', function () {
        // controls가 잠겨 있지 않을 때는 블록을 설치하거나 파괴할 수 없습니다.
        canInteract = false;
    });
    
    document.addEventListener('mousedown', function (event) {
        if (canInteract) {
            switch (event.button) {
                case 0: // Left button
                    onMouseClick(event); // 블록 파괴
                    break;
                case 2: // Right button
                    onRightClick(event); // 블록 설치
                    break;
            }
        }
    });
  
    // Add mouse click event listener
    document.addEventListener('click', function() {
        controls.lock();
    }, false);
    
    window.addEventListener('contextmenu', function(event) {
        if (canInteract) {
            onRightClick(event);
        }
        // 기본 브라우저 컨텍스트 메뉴 이벤트를 막습니다.
        event.preventDefault();
    }, false);

    window.addEventListener('keydown', function(event) {
      switch (event.keyCode) {
        case 87: // W
          keys.forward = true;
          break;
        case 83: // S
          keys.backward = true;
          break;
        case 65: // A
          keys.left = true;
          break;
        case 68: // D
          keys.right = true;
          break;
        case 32: // Space
          if (canJump === true) {
            velocity.y += 0.7; // Jump speed
            canJump = false;
          }
          break;
      }
    }, false);
    
    window.addEventListener('keyup', function(event) {
      switch (event.keyCode) {
        case 87: // W
          keys.forward = false;
          break;
        case 83: // S
          keys.backward = false;
          break;
        case 65: // A
          keys.left = false;
          break;
        case 68: // D
          keys.right = false;
          break;
      }
    }, false);
}

function createBlock(x, y, z) {
    geometry = new THREE.BoxGeometry(1, 1, 1);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    blocks.push(mesh);
}

function animate() {
  requestAnimationFrame(animate);

  // 플레이어가 공중에 있을 경우, 중력에 의해 아래로 떨어지도록 속도를 조절합니다.
  if (!canJump) {
      velocity.y -= 0.04; // 중력 가속도
  }

  // 플레이어의 위치를 업데이트합니다.
  if (keys.forward) {
      controls.moveForward(speed);
  }
  if (keys.backward) {
      controls.moveForward(-speed);
  }
  if (keys.left) {
      controls.moveRight(-speed);
  }
  if (keys.right) {
      controls.moveRight(speed);
  }
  controls.getObject().position.y += velocity.y;

  // 만약 플레이어가 땅에 닿았다면, 속도를 0으로 리셋하고 점프 가능 상태로 바꿉니다.
  // 여기서 블록의 높이는 1이고, 플레이어의 높이는 2이므로, 플레이어의 y 좌표가 2 이하라면 땅에 닿은 것으로 판단합니다.
  if (controls.getObject().position.y <= 2) {
      velocity.y = 0;
      controls.getObject().position.y = 2;
      canJump = true;
  }

  renderer.render(scene, camera);
}

function onMouseClick(event) {
    event.preventDefault();

    let mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    let intersects = raycaster.intersectObjects(blocks);
    if(intersects.length > 0) {
        let intersect = intersects[0];
        scene.remove(intersect.object);
        let index = blocks.indexOf(intersect.object);
        blocks.splice(index, 1);
    }
}

function onRightClick(event) {
  event.preventDefault();

  let mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  let raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  let intersects = raycaster.intersectObjects(blocks);
  if(intersects.length > 0) {
      let intersect = intersects[0];
      createBlock(intersect.object.position.x, intersect.object.position.y + 1, intersect.object.position.z);
  }
}
