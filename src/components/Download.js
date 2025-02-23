import React, { useState } from 'react';
import { returnDomain } from '../utils/img';

const keeperKeys = [
    'sb','catalog','man','bran','year','circa','surf',
    'thickness','thicknessWord','gloss','glossWord','dmin','dmax','colorWord','roughness','textureWord',
    'expressiveness','auc','processing','backp','toner','resin','postcard'
];

const headerNames = {
    'sb': 'IsSampleBook',
    'catalog': 'CatalogNumber',
    'man': 'Manufacturer',
    'bran': 'Brand',
    'year': 'Year',
    'circa': 'DateIsApproximate',
    'surf': 'Surface',
    'thickness': 'Thickness_mm',
    'thicknessWord': 'ThicknessDescription',
    'gloss': 'GlossUnits',
    'glossWord': 'GlossDescription',
    'dmin': 'WarmthAtDmin',
    'dmax': 'WarmthAtDmax',
    'colorWord': 'ColorDescription',
    'roughness': 'Roughness',
    'textureWord': 'TextureDescription',
    'expressiveness': 'Expressiveness',
    'auc': 'Fluorescence',
    'processing': 'HasProcessingInstructions',
    'backp': 'Backprint',
    'toner': 'Toner',
    'resin': 'IsResinCoated',
    'postcard': 'IsPostcard'    
};

const Download = ({ data, idxList, etitle, filename = 'lml.csv' }) => {
    const [showModal, setShowModal] = useState(false);

    const handleDownload = () => {
        setShowModal(false); 

        const headers = Object.keys(data).filter(key => keeperKeys.includes(key));
        const renamedHeaders = headers.map(header => headerNames[header] || header);
        const csvRows = [renamedHeaders.join(',')]; 
        const indices = idxList.length > 0 ? idxList : Array.from({ length: data[headers[0]].length }, (_, i) => i);
    
        const filteredData = headers.map(header => (
            indices.map(index => data[header][index])
        ));

        const numRows = filteredData[0].length;

        for (let i = 0; i < numRows; i++) {
            const values = headers.map((header, headerIndex) => {
                const value = filteredData[headerIndex][i];
                const escaped = ('' + value).replace(/"/g, '\\"');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const link = document.createElement('a');
        link.download = filename;
        link.href = window.URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleModalOpen = () => {
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
    };

    return (
        <>
            <button title={etitle} className="material-icons downloadButton" onClick={handleModalOpen}>file_download</button>
            {showModal && (
                <div id='downloadTermsModal'>
                    <div id='downloadTermsModalContent'>
                        <p>Please read the <a href={returnDomain() + "terms.html"} target="_blank">Terms of Use</a> before downloading.</p>
                        <button id='yesreadterms' onClick={handleDownload}>Yes, I have read the terms.</button>
                        <button id='noreadterms' onClick={handleModalClose}>No, cancel download.</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Download;
