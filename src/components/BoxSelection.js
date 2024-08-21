import { useThree } from '@react-three/fiber';
import { Vector3, Matrix4, Frustum, Box3, Plane } from 'three';
import { useEffect } from 'react';

export default function BoxSelection({ 
  setBoxSelectMode, 
  isSelecting, 
  selectionDivRef, 
  setSelectionBox, 
  setIsSelecting, 
  clickedItems, 
  setClickedItems, 
  setMultiClick, 
  invalidateSignal, 
  setInvalidateSignal, 
  glyph,
  glyphToMap,
 }) {
    const { camera, scene } = useThree();
  
    useEffect(() => {
      const handleMouseDown = (e) => {
  
        const x = e.clientX;
        const y = e.clientY;
    
        setIsSelecting(true);
        setSelectionBox({ x: x, y: y, width: 0, height: 0 });
    
        // Show the selection div
        if ( selectionDivRef.current ) {
          selectionDivRef.current.style.left = `${x}px`;
          selectionDivRef.current.style.top = `${y}px`;
          selectionDivRef.current.style.width = `0px`;
          selectionDivRef.current.style.height = `0px`;
          selectionDivRef.current.style.display = 'block';
        }
      };
    
      const handleMouseMove = (e) => {
        if ( !isSelecting ) return;
      
        setSelectionBox(prevSelectionBox => {
          const width = e.clientX - prevSelectionBox.x;
          const height = e.clientY - prevSelectionBox.y;
      
          selectionDivRef.current.style.left = `${prevSelectionBox.x}px`;
          selectionDivRef.current.style.top = `${prevSelectionBox.y}px`;
          selectionDivRef.current.style.width = `${width}px`;
          selectionDivRef.current.style.height = `${height}px`;
      
          return {
            x: prevSelectionBox.x,
            y: prevSelectionBox.y,
            width: width,
            height: height,
          };
        });
      };
    
      const handleMouseUp = () => {
        if ( !isSelecting ) return;
  
        const selectionRect = selectionDivRef.current.getBoundingClientRect();
        const selectionWidth = selectionRect.width;
        const selectionHeight = selectionRect.height;
        const selectionX = selectionRect.left;
        const selectionY = selectionRect.top;
    
        // Normalized Device Coordinates (NDC) have x and y coordinates between -1 and 1
        const topLeftNDC = new Vector3(
          (selectionX / window.innerWidth) * 2 - 1,
          -(selectionY / window.innerHeight) * 2 + 1,
          -1
        );
        const topRightNDC = new Vector3(
          ((selectionX + selectionWidth) / window.innerWidth) * 2 - 1,
          -(selectionY / window.innerHeight) * 2 + 1,
          -1
        );
        const bottomLeftNDC = new Vector3(
          (selectionX / window.innerWidth) * 2 - 1,
          -((selectionY + selectionHeight) / window.innerHeight) * 2 + 1,
          -1
        );
        const bottomRightNDC = new Vector3(
          ((selectionX + selectionWidth) / window.innerWidth) * 2 - 1,
          -((selectionY + selectionHeight) / window.innerHeight) * 2 + 1,
          -1
        );
  
        const nearTopLeft = topLeftNDC.clone().unproject(camera);
        const nearTopRight = topRightNDC.clone().unproject(camera);
        const nearBottomLeft = bottomLeftNDC.clone().unproject(camera);
        const nearBottomRight = bottomRightNDC.clone().unproject(camera);
  
        // Change the NDC z-value to 1 to use the far clipping plane
        topLeftNDC.z = 1;
        topRightNDC.z = 1;
        bottomLeftNDC.z = 1;
        bottomRightNDC.z = 1;
  
        const farTopLeft = topLeftNDC.clone().unproject(camera);
        const farTopRight = topRightNDC.clone().unproject(camera);
        const farBottomLeft = bottomLeftNDC.clone().unproject(camera);
        const farBottomRight = bottomRightNDC.clone().unproject(camera);
  
        // Counterclockwise winding order, but normals must point inward, so reverse
        const planes = [
          new Plane().setFromCoplanarPoints(farTopLeft, nearTopLeft, nearBottomLeft), // left
          new Plane().setFromCoplanarPoints(farBottomRight, nearBottomRight, nearTopRight), // right
          new Plane().setFromCoplanarPoints(farTopRight, nearTopRight, nearTopLeft), // top
          new Plane().setFromCoplanarPoints(farBottomLeft, nearBottomLeft, nearBottomRight), // bottom
          new Plane().setFromCoplanarPoints(nearBottomLeft, nearTopLeft, nearTopRight), // near
          new Plane().setFromCoplanarPoints(farBottomRight, farTopRight, farTopLeft), // far
        ];
  
        const frustum = new Frustum(...planes);
  
        const glyphMap = glyphToMap[glyph];
        const intersects = [];
  
        scene.children.forEach((child) => {
          if (child.isInstancedMesh && child.geometry) {
            if (!child.geometry.boundingBox) {
              child.geometry.computeBoundingBox();
            }
        
            const instanceMatrix = new Matrix4();
        
            for (let i = 0; i < child.count; i++) {
              child.getMatrixAt(i, instanceMatrix);
              const instanceBoundingBox = new Box3().copy(child.geometry.boundingBox).applyMatrix4(instanceMatrix);
        
              if (frustum.intersectsBox(instanceBoundingBox)) {
                const meshName = child.name; // Make sure 'name' is properly assigned
                const globalIndices = glyphMap[meshName];
                const globalIndex = globalIndices[i];
                intersects.push({ mesh: child, instanceId: i, globalIndex: globalIndex });
              }
            }
          }
        });
        
        const updatedClickedItems = [...clickedItems, ...intersects.map(d => d.globalIndex)];
        
        if ( updatedClickedItems.length > 1 ) {
          setMultiClick(true);
        }
  
        setClickedItems(updatedClickedItems);
        setInvalidateSignal(!invalidateSignal);
        setIsSelecting(false);
        setBoxSelectMode(false);
    
        if (selectionDivRef.current) {
          selectionDivRef.current.style.display = 'none';
        }
      };
    
      window.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    
      return () => {
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isSelecting, selectionDivRef, camera, scene]);
  
    return null;
  }