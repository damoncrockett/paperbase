import React from 'react';

const keeperKeys = [
    'sb','catalog','man','bran','year','circa','surf',
    'thickness','thicknessWord','gloss','glossWord','dmin','dmax','colorWord','roughness','textureWord',
    'expressiveness','auc','processing','backp','toner','resin','postcard'
];

// Define a mapping from the original key to the new header name
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
    const handleDownload = () => {
        // Filter headers to include only keeper keys
        const headers = Object.keys(data).filter(key => keeperKeys.includes(key));
        
        // Rename headers according to the headerNames map
        const renamedHeaders = headers.map(header => headerNames[header] || header);

        const csvRows = [renamedHeaders.join(',')]; // First row as renamed headers

        const indices = idxList.length > 0 ? idxList : Array.from({ length: data[headers[0]].length }, (_, i) => i);
    
        // Filter each column's data based on indices
        const filteredData = headers.map(header => (
            indices.map(index => data[header][index])
        ));

        // Determine the number of rows in the filtered data
        const numRows = filteredData[0].length; // Using the first column to determine row count

        // Construct each row by iterating over the number of filtered rows
        for (let i = 0; i < numRows; i++) {
            const values = headers.map((header, headerIndex) => {
                const value = filteredData[headerIndex][i]; // Access the i-th element of each filtered column array
                const escaped = ('' + value).replace(/"/g, '\\"'); // Escape double quotes
                return `"${escaped}"`; // Ensure each value is enclosed in quotes
            });
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\n');
        
        // Create a Blob from the CSV string
        const blob = new Blob([csvString], { type: 'text/csv' });

        // Create a link element
        const link = document.createElement('a');
        
        // Set the download attribute with a filename
        link.download = filename;
        
        // Create a URL for the blob and set it as href
        link.href = window.URL.createObjectURL(blob);
        
        // Append the link to the body
        document.body.appendChild(link);
        
        // Trigger the download by simulating a click
        link.click();
        
        // Remove the link after download
        document.body.removeChild(link);
    };

    return <button title={etitle} className="material-icons downloadButton" onClick={handleDownload}>file_download</button>;
};

export default Download;
