# MaicoV2

## Soundexamples:
Find some soundexamples from the commissioned works with explanations in the "Example_Mosi" folder: https://github.com/visvar/MAICoV2/tree/main/Example_Mosi

## Sessionexamples:
Find a session example from Brachtel in the "Example_Session" folder: https://github.com/visvar/MAICoV2/tree/main/Example_Session
 
## Find the Website here:
https://visvar.github.io/MAICoV2/ for an older version or
https://maicomidi.web.app/ for the current version.

## How to use
Best use is in fullmode on 16x10 Format (minimum1900 x 1080 px) in the browser (tested in Chrome and Edge).
Normal Browser window should work as well, as long as it keeps the size mentioned before.
Your browser should be able to use Webmidi if you want to use Midi controls or output, and you should allow the website to access Midi. 

### Generate Melodies from a Primer (Midi file) or record one on your own
1. Click on "Import/Export" to open the Menu.
2. 
   1. Select a file in "Import Midi as Primer --> now the melody is stored in the Primerlist (you can clear and delete single entries)
   2. If you want to record a primer via Midicontrolers, click on "Recording". In the new section you can select the Midiinput and bind a button to start recording or simply start by clicking the mircophone icon. Stop the recording (like start) and it will turn the recording into a primer
3. Use the two filters to guide the generation: 
   - First draw the range of pitches allowed per step. Left click on mouse and drag to control top line, hold alt to draw the bottom line.
   - Click on the keys to allow or forbid them. Blue color indicates allowance.
   - allow tonality strangers, the number of keys that are not allowed but can still appear.
   - allow for music adjustments with rules, melodies that do not fit into the filters are adjusted by moving pitches in octaves or single steps to fit.
4. Select the length of the generated sample (default 4 bars = 64 steps) and the number of iterations. Each iteration generates 15 Melodies with different Temperature values (AI Parameter) between 0.2 and 1.6 incrementing by 0.1.
5. MusicVAE models have a similarity parameter which is used during generation and should influence how close the melodies are compared to the primer. You can choose a value between 0.7 and 1 which is used for every melody.
7. Click "Generate from Models" and wait for the generated melodies (currently an internet connection is needed)

The Map in the middle of the screen shows all samples. The Primer is a black dot with black/grey background.

### Generate Polyphony
1. Click on "Import/Export" and then on "Polyphony" to open the Menu.
2. Select the rule that is used to combine the monophonic samples and press generate.

### Session
It is helpful/advised to export the session under "Import/Export", in order to use the same samples later on or if a bug appears.
Here you also are allowed to open the session file.

### Models
In the part "Model Description", we can see which model produces how many melodies (number next to the name), as well as how many melodies you saw, listened to, and liked/disliked.
The colors of the names also reference the colors in the scatterplot, when "Model" is selected in Visualizations.
By clicking a models name you can disable a model, so non of their melodies are shown anymore, this even disables them when generating new melodies so that they are not used.

### Layout
Under "Layout & Axes" you can select whether monophonic or polyphonic samples should be displayed and switch between the similarity layout, correlation based, timbre, or export layout.
In Correlation Mode you can click cells of the matrix to select the axes. 
In Export Layout you can arrange (via rules or manually by selecting) all melodies, that are selected via the folder, and play/export the whole arrangement under the "import/export" section.

### Visualization
In the section "Visualization" you can change the color of the points, backgrounds and the glyph type (small representation in the Map).
Also the color legends for selected visualizations are shown here.
Additionally you can enable lense mode (right click a glyph to see a bigger version), seen/rate mode which shows little icons to indicate seen and rated melodies, as well as toggle the edge for poly mode, which shows edges between polyphonic samples that share the same monophonic voice.
Under "Features & Metrics" you can change the weight for the similarity metric used to place the melodies.

### Interaction with Melodies
Brush the samples you want to inspect. 
The selected Samples are then shown on the left in a piano roll with some information about the model and temperature at the top. 
At the top right you can like, dislike or add the melody to the export list. 
Rightclick into the pianoroll to listen to the melody.
Under "Features & Metrics" you can toggle whether melodies should be played via MidiOut or normally and also change the BPM for playback.

### Clustering

Click on "Clustering" to open the Menu. By clicking on the first Button, you can enable hierarchical clustering and see the convex hulls of clusters with a representative.
One can also show the glyphs for all points via toggle and adjust the sizes of points and representatives in the main view.
Adjusting the thresholds for clusters and represantatives seperately to create clusters or multiple representatifves of one cluster. 
While by default the most center element is used as representative one can also use an average glyph of the cluster.

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


