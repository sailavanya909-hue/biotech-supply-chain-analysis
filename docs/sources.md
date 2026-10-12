# Sources and attribution

Original data authors: **Janja Žagar and Jurij Mihelič**.

Dataset collection: [10.6084/m9.figshare.c.5645578](https://doi.org/10.6084/m9.figshare.c.5645578).

Data descriptor: Žagar, J. & Mihelič, J. *Big data collection in pharmaceutical manufacturing and its use for product quality predictions*. Scientific Data 9, 99 (2022). [10.1038/s41597-022-01203-x](https://doi.org/10.1038/s41597-022-01203-x).

## Included files

| Publisher file | Figshare article | Use in this project |
| --- | --- | --- |
| Laboratory.csv | [16676263](https://figshare.com/articles/dataset/16676263) | Actual batch identifiers, product codes, strengths, target sizes, month labels, material genealogy, yields, and laboratory measurements |
| Process.csv | [16676260](https://figshare.com/articles/dataset/16676260) | Publisher-derived batch-level features from compression sensor trajectories |
| Normalization.csv | [16676266](https://figshare.com/articles/dataset/16676266) | Retained source context; not reapplied to already-derived process features |

All three files were downloaded from the publisher's file endpoints and preserved byte-for-byte. `data/raw/source-manifest.json` records file IDs, download URLs, byte sizes, publisher MD5 checksums, and locally calculated SHA-256 hashes. The download script rejects checksum mismatches. The complete 10-second time-series archive is outside this project's scope; the processed features are sufficient for the stated batch-level analysis.

## License and modifications

Source data are licensed **Creative Commons Attribution 4.0 International**: https://creativecommons.org/licenses/by/4.0/.

Raw source files are unchanged. Derived outputs join laboratory and process records, standardize month labels, select fields, calculate weighted yields and positive target-equivalent gaps, and summarize descriptive associations. Dashboard visualizations and review documentation are transformations of these records. This attribution applies to the raw data and derived analysis; it does not imply endorsement by the original authors or their institutions.
