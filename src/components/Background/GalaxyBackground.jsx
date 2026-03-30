import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const GalaxyBackground = ({ isDark }) => {
	const mountRef = useRef(null);
	const sceneRef = useRef(null);
	const rendererRef = useRef(null);
	const frameIdRef = useRef(null);

	useEffect(() => {
		if (!mountRef.current) return;

		// 1. Setup Scene
		const width = mountRef.current.clientWidth || window.innerWidth;
		const height = mountRef.current.clientHeight || window.innerHeight;

		const scene = new THREE.Scene();
		// Nền đen tuyền hoặc sương mù nhẹ để tạo chiều sâu
		scene.background = new THREE.Color('#000000');
		// Thêm sương mù màu đen để các sao ở xa mờ dần đi
		scene.fog = new THREE.FogExp2(0x000000, 0.02);

		sceneRef.current = scene;

		const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
		camera.position.z = 30; // Kéo camera ra xa hơn một chút

		const renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true,
			powerPreference: "high-performance"
		});

		rendererRef.current = renderer;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		renderer.setPixelRatio(dpr);
		renderer.setSize(width, height);
		renderer.domElement.style.position = 'absolute';
		renderer.domElement.style.top = '0';
		renderer.domElement.style.left = '0';
		renderer.domElement.style.width = '100%';
		renderer.domElement.style.height = '100%';
		renderer.domElement.style.zIndex = '-1'; // Nằm dưới cùng
		mountRef.current.appendChild(renderer.domElement);

		// 2. Custom Shader cho Ngôi Sao (Tạo hiệu ứng phát sáng/nhấp nháy)
		// Vertex Shader: Tính toán vị trí và độ lớn
		const vertexShader = `
      uniform float uTime;
      attribute float aScale;
      attribute float aRandom;
      varying float vAlpha;
      
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Kích thước sao thay đổi theo khoảng cách (Perspective)
        gl_PointSize = aScale * (300.0 / -mvPosition.z);
        
        // Logic nhấp nháy: dùng hàm sin theo thời gian + random offset
        // Tạo hiệu ứng "thở" (glowing)
        float twinkle = sin(uTime * 2.0 + aRandom * 100.0);
        // Alpha dao động từ 0.3 đến 1.0
        vAlpha = 0.3 + 0.7 * (0.5 + 0.5 * twinkle);
      }
    `;

		// Fragment Shader: Vẽ hình tròn mềm và áp dụng màu
		const fragmentShader = `
      varying float vAlpha;
      
      void main() {
        // Vẽ hình tròn thay vì hình vuông mặc định
        float r = distance(gl_PointCoord, vec2(0.5));
        if (r > 0.5) discard;
        
        // Tạo hiệu ứng tỏa sáng (glow) từ tâm ra ngoài
        float glow = 1.0 - (r * 2.0);
        glow = pow(glow, 1.5); 
        
        // Màu trắng (1.0, 1.0, 1.0)
        gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha * glow);
      }
    `;

		// 3. Tạo hạt (Particles)
		const particlesCount = 2000; // Số lượng sao
		const positions = new Float32Array(particlesCount * 3);
		const scales = new Float32Array(particlesCount);
		const randoms = new Float32Array(particlesCount); // Để mỗi sao nhấp nháy lệch pha nhau

		for (let i = 0; i < particlesCount; i++) {
			const i3 = i * 3;
			// Phân bố ngẫu nhiên trong không gian
			positions[i3] = (Math.random() - 0.5) * 80;
			positions[i3 + 1] = (Math.random() - 0.5) * 80;
			positions[i3 + 2] = (Math.random() - 0.5) * 80;

			// Kích thước ngẫu nhiên
			scales[i] = Math.random();
			// Giá trị random cho shader
			randoms[i] = Math.random();
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
		geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

		const material = new THREE.ShaderMaterial({
			vertexShader,
			fragmentShader,
			uniforms: {
				uTime: { value: 0 }
			},
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending // Cộng hưởng ánh sáng
		});

		const particles = new THREE.Points(geometry, material);
		scene.add(particles);

		// 4. Animation Loop
		const clock = new THREE.Clock();

		const animate = () => {
			frameIdRef.current = requestAnimationFrame(animate);

			const elapsedTime = clock.getElapsedTime();

			// Cập nhật thời gian cho shader (để nhấp nháy)
			material.uniforms.uTime.value = elapsedTime;

			// Xoay nhẹ toàn bộ thiên hà
			particles.rotation.y = elapsedTime * 0.05;
			particles.rotation.x = elapsedTime * 0.02;

			renderer.render(scene, camera);
		};

		animate();

		// 5. Handle Resize
		const handleResize = () => {
			if (!mountRef.current) return;
			const w = mountRef.current.clientWidth || window.innerWidth;
			const h = mountRef.current.clientHeight || window.innerHeight;
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			renderer.setSize(w, h);
			renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
		};

		window.addEventListener('resize', handleResize);

		// Cleanup
		return () => {
			window.removeEventListener('resize', handleResize);
			if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);

			try {
				if (mountRef.current && renderer.domElement) {
					mountRef.current.removeChild(renderer.domElement);
				}
			} catch (e) { }

			geometry.dispose();
			material.dispose();
			renderer.dispose();
			sceneRef.current = null;
		};
	}, []); // Bỏ dependency isDark vì chúng ta fix cứng Trắng/Đen

	return (
		<div
			ref={mountRef}
			className="galaxy-background"
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				zIndex: -1, // Đảm bảo nằm dưới cùng
				background: '#000000', // Fallback background
				overflow: 'hidden',
			}}
		/>
	);
};

export default GalaxyBackground;