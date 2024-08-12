import React from 'react';

const keeperKeys = [
    'sb','catalog','man','bran','year','circa','surf',
    'thickness','thicknessWord','gloss','glossWord','dmin','dmax','colorWord','roughness','textureWord',
    'expressiveness','auc','processing','backp','toner','resin','postcard'
]

const Download = ({ data, filterIdxList, filename = 'lml.csv' }) => {
    const handleDownload = () => {
        // Filter headers to include only keeper keys
        const headers = Object.keys(data).filter(key => keeperKeys.includes(key));
        const csvRows = [headers.join(',')]; // First row as headers

        // Determine indices to use based on filterIdxList
        const indices = filterIdxList.length > 0 ? filterIdxList : Array.from({ length: data[headers[0]].length }, (_, i) => i);

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

    return <button title="Download filtered data as CSV" className="material-icons downloadButton" onClick={handleDownload}>file_download</button>;
};

export default Download;