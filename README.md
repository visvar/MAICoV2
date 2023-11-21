# MaicoV2
 
## Find the Website here:
https://visvar.github.io/MAICoV2/

## How to use
Best use is in fullmode on 1900 x 1080 px in the browser (tested in Chrome and Edge).
Normal Browser window should work as well, as long as it keeps the size mentioned before.

### Generate Melodies from a Primer (Midi file)
1. Click on "Import/Export" to open the Menu.
2. Select a file in "Import Midi as Primer --> now the melody is stored in the Primerlist (you can clear and delete single entries - selected by the slider below)
3. Use the two filters to guide the generation: 
   - First draw the range of pitches allowed per step. Left click on mouse and drag to control top line, hold alt to draw the bottom line.
   - Click on the keys to allow or forbid them. Blue color indicates allowance.
   - allow tonality strangers, the number of keys that are not allowed but can still appear.
   - allow for music adjustments with rules, melodies that do not fit into the filters are adjusted by moving pitches in octaves or single steps to fit.
4. Select the length of the generated sample (default 4 bars = 64 steps) and the number of iterations. Each iteration generates 15 Melodies with different Temperature values (AI Parameter) between 0.2 and 1.6 incrementing by 0.1.
5. MusicVAE models have a similarity parameter which is used during generation and should influence how close the melodies are compared to the primer. You can choose a value between 0.7 and 1 which is used for every melody.
6. Click "Import Models" to initialize all models. These are then shown in "Model Description" at the bottom
7. Click "Generate from Models" and wait for the generated melodies (currently an internet connection is needed)

The Map in the middle of the screen shows all samples. The Primer is a black dot with black/grey background.

### Models
In the part "Model Description", we can see which model produces how many melodies (number next to the name), as well as how many melodies you saw, listened to, and liked/disliked.
The colors of the names also reference the colors in the scatterplot, when "Model" is selected in Visualizations.
By clicking a models name you can disable a model, so non of their melodies are shown anymore.

### Visualization
In the section "Visualization" you can change the color of the points, backgrounds and the glyph type (small representation in the Map).
Also the color legends for selected visualizations are shown here.

### Interaction with Melodies
Brush the samples you want to inspect. 
The selected Samples are then shown on the left in a piano roll with some information about the model and temperature at the top. 
At the top right you can like, dislike or add the melody to the export list. 
Rightclick into the pianoroll to listen to the melody.

### Filter
In the filter section you can filter all shown melodies by values like number of notes etc.
Click the icons to show all melodies you have interacted with. The background of the icon indicates the mode.
- Eye: all (white), seen (blue), not seen (red)
- Ear: all (white), listened to (blue), not listened to (red)
- Thumbs up: all (white), liked (blue)
- Thumbs down: all (white), disliked (red)
- Folder: all (white), in export list (blue)

### Export as Midi
Go to "Import/Export" and select the Format on how to export your selected melodies. 
- seperate Files: Each melody is exported as a single MIDI file
- seperate Tracks: Export a single Midi file where each track is one of your selected melody
- sucessivly: Export all melodies, played after another, in a single track and MIDI file.
Then click export.
