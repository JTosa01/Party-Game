import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { WordList } from "@/types/game";

export interface CategorizedWord {
  word: string;
  category: string;
  similar: string[]; // Similar words to show impostor
}

// Comprehensive word list with categories and similar words
const CATEGORIZED_WORDS: CategorizedWord[] = [
  // Animals
// Animals - additional
{ word: "Octopus", category: "Animals", similar: ["Squid", "Jellyfish", "Cuttlefish"] },
{ word: "Flamingo", category: "Animals", similar: ["Heron", "Crane", "Stork"] },
{ word: "Cheetah", category: "Animals", similar: ["Leopard", "Jaguar", "Panther"] },
{ word: "Gorilla", category: "Animals", similar: ["Chimpanzee", "Orangutan", "Baboon"] },
{ word: "Crocodile", category: "Animals", similar: ["Alligator", "Caiman", "Monitor Lizard"] },
{ word: "Eagle", category: "Animals", similar: ["Hawk", "Falcon", "Osprey"] },
{ word: "Shark", category: "Animals", similar: ["Barracuda", "Orca", "Swordfish"] },
{ word: "Chameleon", category: "Animals", similar: ["Gecko", "Iguana", "Anole"] },
{ word: "Peacock", category: "Animals", similar: ["Pheasant", "Turkey", "Parrot"] },
{ word: "Platypus", category: "Animals", similar: ["Echidna", "Beaver", "Otter"] },

// Technology - additional
{ word: "Smartphone", category: "Technology", similar: ["Tablet", "Pager", "Walkie-Talkie"] },
{ word: "Drone", category: "Technology", similar: ["Helicopter", "Glider", "Quadcopter"] },
{ word: "Submarine", category: "Technology", similar: ["Bathyscaphe", "Torpedo Boat", "Diving Bell"] },
{ word: "Camera", category: "Technology", similar: ["Camcorder", "Projector", "Webcam"] },
{ word: "Calculator", category: "Technology", similar: ["Abacus", "Slide Rule", "Comptometer"] },
{ word: "Laser", category: "Technology", similar: ["Flashlight", "Radar", "Sonar"] },
{ word: "Radar", category: "Technology", similar: ["Sonar", "Lidar", "Scanner"] },
{ word: "3D Printer", category: "Technology", similar: ["Laser Cutter", "Plotter", "CNC Machine"] },

// Food & Drink
{ word: "Pizza", category: "Food", similar: ["Calzone", "Flatbread", "Focaccia"] },
{ word: "Sushi", category: "Food", similar: ["Sashimi", "Tempura", "Maki"] },
{ word: "Chocolate", category: "Food", similar: ["Fudge", "Toffee", "Caramel"] },
{ word: "Coffee", category: "Food", similar: ["Espresso", "Tea", "Cappuccino"] },
{ word: "Burger", category: "Food", similar: ["Hot Dog", "Sandwich", "Wrap"] },
{ word: "Taco", category: "Food", similar: ["Burrito", "Quesadilla", "Enchilada"] },
{ word: "Popcorn", category: "Food", similar: ["Nachos", "Pretzels", "Pork Rinds"] },
{ word: "Spaghetti", category: "Food", similar: ["Linguine", "Fettuccine", "Penne"] },
{ word: "Croissant", category: "Food", similar: ["Baguette", "Danish", "Brioche"] },
{ word: "Cheesecake", category: "Food", similar: ["Tiramisu", "Pavlova", "Mousse"] },

// Sports
{ word: "Olympics", category: "Sports", similar: ["Commonwealth Games", "World Cup", "Pan American Games"] },
{ word: "Basketball", category: "Sports", similar: ["Volleyball", "Netball", "Handball"] },
{ word: "Soccer", category: "Sports", similar: ["Rugby", "Field Hockey", "Lacrosse"] },
{ word: "Tennis", category: "Sports", similar: ["Badminton", "Squash", "Racquetball"] },
{ word: "Boxing", category: "Sports", similar: ["Wrestling", "Karate", "Kickboxing"] },
{ word: "Surfing", category: "Sports", similar: ["Wakeboarding", "Windsurfing", "Kiteboarding"] },
{ word: "Archery", category: "Sports", similar: ["Javelin", "Crossbow", "Darts"] },
{ word: "Fencing", category: "Sports", similar: ["Kendo", "Swordfighting", "Jousting"] },

// Structures - additional
{ word: "Cathedral", category: "Structures", similar: ["Church", "Basilica", "Monastery"] },
{ word: "Colosseum", category: "Structures", similar: ["Amphitheater", "Stadium", "Arena"] },
{ word: "Skyscraper", category: "Structures", similar: ["Tower", "High-rise", "Spire"] },
{ word: "Dungeon", category: "Structures", similar: ["Prison", "Catacomb", "Vault"] },
{ word: "Aqueduct", category: "Structures", similar: ["Canal", "Pipeline", "Viaduct"] },
{ word: "Igloo", category: "Structures", similar: ["Yurt", "Tepee", "Cabin"] },
{ word: "Windmill", category: "Structures", similar: ["Watermill", "Turbine", "Silo"] },

// Objects - additional
{ word: "Sword", category: "Objects", similar: ["Dagger", "Spear", "Scimitar"] },
{ word: "Throne", category: "Objects", similar: ["Crown", "Scepter", "Orb"] },
{ word: "Lantern", category: "Objects", similar: ["Torch", "Candle", "Brazier"] },
{ word: "Map", category: "Objects", similar: ["Atlas", "Chart", "Blueprint"] },
{ word: "Mirror", category: "Objects", similar: ["Window", "Lens", "Prism"] },
{ word: "Cauldron", category: "Objects", similar: ["Furnace", "Crucible", "Kiln"] },
{ word: "Anchor", category: "Objects", similar: ["Rudder", "Helm", "Mast"] },
{ word: "Magnifying Glass", category: "Objects", similar: ["Monocle", "Telescope", "Loupe"] },
{ word: "Boomerang", category: "Objects", similar: ["Frisbee", "Discus", "Javelin"] },
{ word: "Trident", category: "Objects", similar: ["Pitchfork", "Spear", "Halberd"] },

// Mythology - additional
{ word: "Medusa", category: "Mythology", similar: ["Hydra", "Gorgon", "Cyclops"] },
{ word: "Zeus", category: "Mythology", similar: ["Poseidon", "Odin", "Jupiter"] },
{ word: "Minotaur", category: "Mythology", similar: ["Centaur", "Satyr", "Chimera"] },
{ word: "Unicorn", category: "Mythology", similar: ["Pegasus", "Alicorn", "Kirin"] },
{ word: "Mermaid", category: "Mythology", similar: ["Siren", "Selkie", "Naiad"] },
{ word: "Werewolf", category: "Mythology", similar: ["Vampire", "Ghoul", "Shapeshifter"] },
{ word: "Kraken", category: "Mythology", similar: ["Leviathan", "Sea Serpent", "Charybdis"] },
{ word: "Valkyrie", category: "Mythology", similar: ["Amazon", "Fury", "Banshee"] },

// Occupations - additional
{ word: "Ninja", category: "Occupations", similar: ["Samurai", "Assassin", "Spy"] },
{ word: "Wizard", category: "Occupations", similar: ["Sorcerer", "Warlock", "Druid"] },
{ word: "Viking", category: "Occupations", similar: ["Barbarian", "Raider", "Berserker"] },
{ word: "Knight", category: "Occupations", similar: ["Paladin", "Squire", "Crusader"] },
{ word: "Detective", category: "Occupations", similar: ["Inspector", "Investigator", "Marshal"] },
{ word: "Surgeon", category: "Occupations", similar: ["Physician", "Medic", "Paramedic"] },
{ word: "Archaeologist", category: "Occupations", similar: ["Anthropologist", "Geologist", "Historian"] },

// ===== MOVIES =====
{ word: "Star Wars", category: "Movies", similar: ["Star Trek", "Dune", "Battlestar Galactica"] },
{ word: "The Godfather", category: "Movies", similar: ["Goodfellas", "Scarface", "Casino"] },
{ word: "Jurassic Park", category: "Movies", similar: ["The Lost World", "King Kong", "Land Before Time"] },
{ word: "Titanic", category: "Movies", similar: ["Poseidon", "The Lusitania", "Bismarck"] },
{ word: "Jaws", category: "Movies", similar: ["Piranha", "Orca", "Deep Blue Sea"] },
{ word: "The Matrix", category: "Movies", similar: ["Inception", "Tron", "Ready Player One"] },
{ word: "Gladiator", category: "Movies", similar: ["Braveheart", "300", "Troy"] },
{ word: "The Lion King", category: "Movies", similar: ["The Jungle Book", "Bambi", "Brother Bear"] },
{ word: "Alien", category: "Movies", similar: ["Predator", "The Thing", "Event Horizon"] },
{ word: "Interstellar", category: "Movies", similar: ["Gravity", "The Martian", "Contact"] },
{ word: "Avatar", category: "Movies", similar: ["Dances with Wolves", "Pocahontas", "FernGully"] },
{ word: "Inception", category: "Movies", similar: ["Shutter Island", "Memento", "Paprika"] },
{ word: "The Shining", category: "Movies", similar: ["Amityville Horror", "Poltergeist", "The Haunting"] },
{ word: "Psycho", category: "Movies", similar: ["Rear Window", "Vertigo", "Rope"] },
{ word: "Schindler's List", category: "Movies", similar: ["The Pianist", "Life is Beautiful", "Sophie's Choice"] },
{ word: "Forrest Gump", category: "Movies", similar: ["Big Fish", "Cast Away", "The Terminal"] },
{ word: "The Dark Knight", category: "Movies", similar: ["Batman Begins", "Watchmen", "Unbreakable"] },
{ word: "Avengers: Endgame", category: "Movies", similar: ["Infinity War", "Age of Ultron", "Civil War"] },
{ word: "Lord of the Rings", category: "Movies", similar: ["The Hobbit", "Willow", "Eragon"] },
{ word: "Pirates of the Caribbean", category: "Movies", similar: ["Treasure Planet", "Hook", "Muppet Treasure Island"] },
{ word: "Back to the Future", category: "Movies", similar: ["Bill & Ted's Excellent Adventure", "The Time Machine", "Looper"] },
{ word: "E.T.", category: "Movies", similar: ["Close Encounters", "Mac and Me", "Batteries Not Included"] },
{ word: "The Wizard of Oz", category: "Movies", similar: ["Alice in Wonderland", "Labyrinth", "Oz the Great and Powerful"] },
{ word: "Rocky", category: "Movies", similar: ["Raging Bull", "Million Dollar Baby", "Creed"] },
{ word: "Die Hard", category: "Movies", similar: ["Lethal Weapon", "Speed", "Under Siege"] },
{ word: "Toy Story", category: "Movies", similar: ["A Bug's Life", "Antz", "Small Soldiers"] },
{ word: "Finding Nemo", category: "Movies", similar: ["The Little Mermaid", "Shark Tale", "Ponyo"] },
{ word: "Shrek", category: "Movies", similar: ["Donkey", "Puss in Boots", "Fiona"] },
{ word: "The Silence of the Lambs", category: "Movies", similar: ["Se7en", "Zodiac", "Mindhunter"] },
{ word: "Pulp Fiction", category: "Movies", similar: ["Reservoir Dogs", "Kill Bill", "Jackie Brown"] },
{ word: "Home Alone", category: "Movies", similar: ["Richie Rich", "Dennis the Menace", "The Burbs"] },
{ word: "Ghostbusters", category: "Movies", similar: ["Men in Black", "Beetlejuice", "The Frighteners"] },
{ word: "Indiana Jones", category: "Movies", similar: ["National Treasure", "The Mummy", "Romancing the Stone"] },
{ word: "Top Gun", category: "Movies", similar: ["Iron Eagle", "Behind Enemy Lines", "Hot Shots"] },
{ word: "Terminator", category: "Movies", similar: ["RoboCop", "Universal Soldier", "Predator"] },
{ word: "Blade Runner", category: "Movies", similar: ["Ghost in the Shell", "The Fifth Element", "Dark City"] },
{ word: "Goodfellas", category: "Movies", similar: ["Casino", "Donnie Brasco", "American Gangster"] },
{ word: "Fight Club", category: "Movies", similar: ["American Psycho", "Se7en", "Memento"] },
{ word: "The Truman Show", category: "Movies", similar: ["Eternal Sunshine", "Being John Malkovich", "The Game"] },
{ word: "Saving Private Ryan", category: "Movies", similar: ["Full Metal Jacket", "Apocalypse Now", "Dunkirk"] },
{ word: "Braveheart", category: "Movies", similar: ["Rob Roy", "William Wallace", "The Patriot"] },
{ word: "The Princess Bride", category: "Movies", similar: ["Willow", "The Court Jester", "Stardust"] },
{ word: "Grease", category: "Movies", similar: ["Saturday Night Fever", "Dirty Dancing", "Footloose"] },
{ word: "Casablanca", category: "Movies", similar: ["Gone with the Wind", "Roman Holiday", "An Affair to Remember"] },
{ word: "Frozen", category: "Movies", similar: ["Tangled", "Moana", "Brave"] },
{ word: "Black Panther", category: "Movies", similar: ["Shang-Chi", "Wakanda Forever", "Thor"] },
{ word: "The Hunger Games", category: "Movies", similar: ["Divergent", "Maze Runner", "Ender's Game"] },
{ word: "Twilight", category: "Movies", similar: ["Interview with a Vampire", "Underworld", "The Vampire Diaries"] },
{ word: "Parasite", category: "Movies", similar: ["Snowpiercer", "Burning", "Oldboy"] },
{ word: "Dune", category: "Movies", similar: ["Foundation", "Ender's Game", "Arrival"] },

// ===== POP CULTURE CHARACTERS =====
// Superheroes & Villains
{ word: "Darth Vader", category: "Pop Culture", similar: ["Emperor Palpatine", "Kylo Ren", "Count Dooku"] },
{ word: "The Joker", category: "Pop Culture", similar: ["The Riddler", "Two-Face", "Scarecrow"] },
{ word: "Superman", category: "Pop Culture", similar: ["Captain America", "Thor", "Shazam"] },
{ word: "Batman", category: "Pop Culture", similar: ["Green Arrow", "Moon Knight", "Nightwing"] },
{ word: "Spider-Man", category: "Pop Culture", similar: ["Ant-Man", "Daredevil", "Nightcrawler"] },
{ word: "Tony Stark", category: "Pop Culture", similar: ["Bruce Wayne", "Reed Richards", "Hank Pym"] },
{ word: "Black Widow", category: "Pop Culture", similar: ["Catwoman", "Elektra", "Huntress"] },
{ word: "Thanos", category: "Pop Culture", similar: ["Darkseid", "Apocalypse", "Galactus"] },
{ word: "Wolverine", category: "Pop Culture", similar: ["Sabretooth", "Deadpool", "Deathstroke"] },
{ word: "Wonder Woman", category: "Pop Culture", similar: ["Xena", "She-Ra", "Valkyrie"] },

// Sci-Fi & Fantasy Characters
{ word: "Gandalf", category: "Pop Culture", similar: ["Dumbledore", "Merlin", "Radagast"] },
{ word: "Voldemort", category: "Pop Culture", similar: ["Sauron", "Morgoth", "The White Witch"] },
{ word: "Hermione Granger", category: "Pop Culture", similar: ["Annabeth Chase", "Lyra Belacqua", "Vin"] },
{ word: "Harry Potter", category: "Pop Culture", similar: ["Frodo Baggins", "Percy Jackson", "Eragon"] },
{ word: "Yoda", category: "Pop Culture", similar: ["Obi-Wan Kenobi", "Mace Windu", "Qui-Gon Jinn"] },
{ word: "Gollum", category: "Pop Culture", similar: ["Dobby", "Grima Wormtongue", "Smeagol"] },
{ word: "Katniss Everdeen", category: "Pop Culture", similar: ["Tris Prior", "Clary Fray", "Feyre Archeron"] },
{ word: "Jon Snow", category: "Pop Culture", similar: ["Aragorn", "Geralt of Rivia", "Arthur Dayne"] },
{ word: "Daenerys Targaryen", category: "Pop Culture", similar: ["Cersei Lannister", "Lady Stoneheart", "Melisandre"] },
{ word: "Sherlock Holmes", category: "Pop Culture", similar: ["Hercule Poirot", "Miss Marple", "Columbo"] },
{ word: "James Bond", category: "Pop Culture", similar: ["Jason Bourne", "Ethan Hunt", "Jack Bauer"] },
{ word: "Indiana Jones", category: "Pop Culture", similar: ["Lara Croft", "Alan Quartermain", "Rick O'Connell"] },
{ word: "Dracula", category: "Pop Culture", similar: ["Nosferatu", "Barnabas Collins", "Lestat"] },
{ word: "Frankenstein", category: "Pop Culture", similar: ["The Mummy", "The Wolfman", "The Creature"] },
{ word: "Hannibal Lecter", category: "Pop Culture", similar: ["Norman Bates", "Patrick Bateman", "Anton Chigurh"] },
{ word: "Willy Wonka", category: "Pop Culture", similar: ["The Mad Hatter", "Doctor Who", "Q"] },
{ word: "Sherlock Holmes", category: "Pop Culture", similar: ["Hercule Poirot", "Philip Marlowe", "Sam Spade"] },
{ word: "Elizabeth Bennet", category: "Pop Culture", similar: ["Emma Woodhouse", "Jane Eyre", "Catherine Morland"] },
{ word: "Atticus Finch", category: "Pop Culture", similar: ["Phillip Pirrip", "Jay Gatsby", "Holden Caulfield"] },
{ word: "Don Corleone", category: "Pop Culture", similar: ["Tony Montana", "Tony Soprano", "Walter White"] },
{ word: "Jack Sparrow", category: "Pop Culture", similar: ["Long John Silver", "Blackbeard", "Captain Hook"] },
{ word: "The Terminator", category: "Pop Culture", similar: ["RoboCop", "The Predator", "ED-209"] },
{ word: "Ellen Ripley", category: "Pop Culture", similar: ["Sarah Connor", "Leia Organa", "Furiosa"] },
{ word: "Forrest Gump", category: "Pop Culture", similar: ["Chance the Gardener", "Benjamin Button", "Big Fish"] },
{ word: "Tyler Durden", category: "Pop Culture", similar: ["Patrick Bateman", "Alex DeLarge", "Travis Bickle"] },
{ word: "Marty McFly", category: "Pop Culture", similar: ["Doc Brown", "Bill S. Preston", "Ted Logan"] },
{ word: "Walter White", category: "Pop Culture", similar: ["Tony Soprano", "Don Draper", "Frank Underwood"] },
{ word: "The Dude", category: "Pop Culture", similar: ["Ferris Bueller", "Lloyd Christmas", "Nacho Libre"] },
{ word: "Shrek", category: "Pop Culture", similar: ["Fiona", "Donkey", "Puss in Boots"] },
{ word: "Simba", category: "Pop Culture", similar: ["Bambi", "Dumbo", "Copper"] },
{ word: "Buzz Lightyear", category: "Pop Culture", similar: ["Woody", "Optimus Prime", "Zurg"] },
{ word: "Elsa", category: "Pop Culture", similar: ["Rapunzel", "Moana", "Merida"] },
{ word: "Captain Jack Sparrow", category: "Pop Culture", similar: ["Captain Barbossa", "Davy Jones", "Captain Hook"] },
{ word: "Gollum", category: "Pop Culture", similar: ["Dobby", "Rumpelstiltskin", "Grima"] },
{ word: "Geralt of Rivia", category: "Pop Culture", similar: ["Aragorn", "Jon Snow", "Duncan the Black"] },
{ word: "Tyrion Lannister", category: "Pop Culture", similar: ["Bronn", "Varys", "Littlefinger"] },
{ word: "Michael Scott", category: "Pop Culture", similar: ["David Brent", "Leslie Knope", "Ron Swanson"] },
{ word: "Walter White", category: "Pop Culture", similar: ["Saul Goodman", "Gustavo Fring", "Mike Ehrmantraut"] },
{ word: "Don Draper", category: "Pop Culture", similar: ["Frank Underwood", "Tony Soprano", "Al Swearengen"] },
{ word: "Dexter Morgan", category: "Pop Culture", similar: ["Hannibal Lecter", "Joe Carroll", "Francis Dolarhyde"] },

// ===== TV SHOWS =====
// Drama
{ word: "Game of Thrones", category: "TV Shows", similar: ["The Witcher", "Vikings", "The Last Kingdom"] },
{ word: "Breaking Bad", category: "TV Shows", similar: ["Better Call Saul", "Ozark", "Narcos"] },
{ word: "The Sopranos", category: "TV Shows", similar: ["The Wire", "Boardwalk Empire", "Peaky Blinders"] },
{ word: "Peaky Blinders", category: "TV Shows", similar: ["Boardwalk Empire", "Taboo", "Gangs of London"] },
{ word: "Stranger Things", category: "TV Shows", similar: ["Dark", "The OA", "Wayward Pines"] },
{ word: "Lost", category: "TV Shows", similar: ["The 100", "FlashForward", "The Leftovers"] },
{ word: "The Walking Dead", category: "TV Shows", similar: ["Fear the Walking Dead", "Z Nation", "Day of the Dead"] },
{ word: "Westworld", category: "TV Shows", similar: ["Black Mirror", "Dollhouse", "Humans"] },
{ word: "House of Cards", category: "TV Shows", similar: ["Succession", "Designated Survivor", "The West Wing"] },
{ word: "Succession", category: "TV Shows", similar: ["House of Cards", "Billions", "Industry"] },
{ word: "Ozark", category: "TV Shows", similar: ["Bloodline", "Rectify", "The Sinner"] },
{ word: "Dexter", category: "TV Shows", similar: ["Mindhunter", "Hannibal", "You"] },
{ word: "Sherlock", category: "TV Shows", similar: ["Elementary", "Poirot", "Monk"] },
{ word: "Downton Abbey", category: "TV Shows", similar: ["Upstairs Downstairs", "Victoria", "The Crown"] },
{ word: "The Crown", category: "TV Shows", similar: ["Victoria", "Reign", "Versailles"] },
{ word: "Mad Men", category: "TV Shows", similar: ["Masters of Sex", "Halt and Catch Fire", "Pan Am"] },
{ word: "The Wire", category: "TV Shows", similar: ["The Shield", "The Corner", "Treme"] },
{ word: "Twin Peaks", category: "TV Shows", similar: ["Wayward Pines", "The Killing", "Top of the Lake"] },
{ word: "The X-Files", category: "TV Shows", similar: ["Fringe", "Warehouse 13", "Supernatural"] },

// Sci-Fi
{ word: "Star Trek", category: "TV Shows", similar: ["Battlestar Galactica", "Babylon 5", "Stargate"] },
{ word: "Doctor Who", category: "TV Shows", similar: ["Quantum Leap", "The Outer Limits", "Farscape"] },
{ word: "Black Mirror", category: "TV Shows", similar: ["Westworld", "Electric Dreams", "The Twilight Zone"] },
{ word: "The Mandalorian", category: "TV Shows", similar: ["Andor", "Obi-Wan Kenobi", "Boba Fett"] },

// Comedy
{ word: "The Simpsons", category: "TV Shows", similar: ["Family Guy", "Futurama", "King of the Hill"] },
{ word: "Friends", category: "TV Shows", similar: ["Seinfeld", "How I Met Your Mother", "New Girl"] },
{ word: "The Office", category: "TV Shows", similar: ["Parks and Recreation", "Arrested Development", "What We Do in the Shadows"] },
{ word: "Seinfeld", category: "TV Shows", similar: ["Curb Your Enthusiasm", "It's Always Sunny", "Friends"] },
{ word: "South Park", category: "TV Shows", similar: ["Beavis and Butt-Head", "Archer", "American Dad"] },
{ word: "Arrested Development", category: "TV Shows", similar: ["Schitt's Creek", "Arrested Development", "Fleabag"] },
{ word: "It's Always Sunny", category: "TV Shows", similar: ["The League", "Workaholics", "Party Down"] },
{ word: "Parks and Recreation", category: "TV Shows", similar: ["The Office", "Brooklyn Nine-Nine", "Abbott Elementary"] },
{ word: "Brooklyn Nine-Nine", category: "TV Shows", similar: ["Barney Miller", "Reno 911", "Angie Tribeca"] },
{ word: "Frasier", category: "TV Shows", similar: ["Cheers", "NewsRadio", "Just Shoot Me"] },

// Reality & Other
{ word: "Survivor", category: "TV Shows", similar: ["The Amazing Race", "Big Brother", "The Challenge"] },
{ word: "The Apprentice", category: "TV Shows", similar: ["Shark Tank", "Dragon's Den", "The Profit"] },
{ word: "Jeopardy!", category: "TV Shows", similar: ["Wheel of Fortune", "Who Wants to be a Millionaire", "The Price is Right"] },

// ===== FAMOUS PEOPLE =====
// Scientists & Inventors
{ word: "Einstein", category: "Famous People", similar: ["Newton", "Tesla", "Hawking"] },
{ word: "Nikola Tesla", category: "Famous People", similar: ["Thomas Edison", "Faraday", "Hertz"] },
{ word: "Marie Curie", category: "Famous People", similar: ["Rosalind Franklin", "Ada Lovelace", "Lise Meitner"] },
{ word: "Charles Darwin", category: "Famous People", similar: ["Alfred Russel Wallace", "Gregor Mendel", "Carl Linnaeus"] },
{ word: "Galileo", category: "Famous People", similar: ["Copernicus", "Kepler", "Brahe"] },
{ word: "Stephen Hawking", category: "Famous People", similar: ["Carl Sagan", "Neil deGrasse Tyson", "Richard Feynman"] },
{ word: "Alan Turing", category: "Famous People", similar: ["John von Neumann", "Claude Shannon", "Grace Hopper"] },
{ word: "Neil Armstrong", category: "Famous People", similar: ["Buzz Aldrin", "Yuri Gagarin", "John Glenn"] },
{ word: "Isaac Newton", category: "Famous People", similar: ["Gottfried Leibniz", "Robert Hooke", "Edmund Halley"] },

// Historical Leaders & Rulers
{ word: "Cleopatra", category: "Famous People", similar: ["Nefertiti", "Boudicca", "Hatshepsut"] },
{ word: "Napoleon", category: "Famous People", similar: ["Julius Caesar", "Alexander the Great", "Frederick the Great"] },
{ word: "Genghis Khan", category: "Famous People", similar: ["Attila the Hun", "Tamerlane", "Kublai Khan"] },
{ word: "Julius Caesar", category: "Famous People", similar: ["Mark Antony", "Augustus", "Pompey"] },
{ word: "Abraham Lincoln", category: "Famous People", similar: ["George Washington", "Theodore Roosevelt", "Ulysses Grant"] },
{ word: "Winston Churchill", category: "Famous People", similar: ["Charles de Gaulle", "Franklin Roosevelt", "Eisenhower"] },
{ word: "Joan of Arc", category: "Famous People", similar: ["Boudicca", "Artemisia", "Grace O'Malley"] },
{ word: "Mahatma Gandhi", category: "Famous People", similar: ["Nelson Mandela", "Martin Luther King Jr.", "Che Guevara"] },
{ word: "Nelson Mandela", category: "Famous People", similar: ["Mahatma Gandhi", "Frederick Douglass", "Desmond Tutu"] },
{ word: "Vladimir Lenin", category: "Famous People", similar: ["Leon Trotsky", "Joseph Stalin", "Mao Zedong"] },
{ word: "Adolf Hitler", category: "Famous People", similar: ["Benito Mussolini", "Joseph Stalin", "Francisco Franco"] },
{ word: "Queen Victoria", category: "Famous People", similar: ["Marie Antoinette", "Catherine the Great", "Isabella I"] },
{ word: "Henry VIII", category: "Famous People", similar: ["Richard III", "Edward VI", "Charles II"] },
{ word: "Vlad the Impaler", category: "Famous People", similar: ["Ivan the Terrible", "Attila the Hun", "Tamerlane"] },

// Artists & Writers
{ word: "Shakespeare", category: "Famous People", similar: ["Dickens", "Chaucer", "Marlowe"] },
{ word: "Leonardo da Vinci", category: "Famous People", similar: ["Michelangelo", "Raphael", "Botticelli"] },
{ word: "Vincent van Gogh", category: "Famous People", similar: ["Paul Gauguin", "Paul Cézanne", "Georges Seurat"] },
{ word: "Pablo Picasso", category: "Famous People", similar: ["Georges Braque", "Salvador Dalí", "Joan Miró"] },
{ word: "Salvador Dalí", category: "Famous People", similar: ["René Magritte", "Max Ernst", "Frida Kahlo"] },
{ word: "Frida Kahlo", category: "Famous People", similar: ["Georgia O'Keeffe", "Mary Cassatt", "Artemisia Gentileschi"] },
{ word: "Edgar Allan Poe", category: "Famous People", similar: ["H.P. Lovecraft", "Ambrose Bierce", "Sheridan Le Fanu"] },
{ word: "Mark Twain", category: "Famous People", similar: ["O. Henry", "Jack London", "Ambrose Bierce"] },
{ word: "Ernest Hemingway", category: "Famous People", similar: ["F. Scott Fitzgerald", "John Steinbeck", "William Faulkner"] },
{ word: "Charles Dickens", category: "Famous People", similar: ["Thomas Hardy", "George Eliot", "William Thackeray"] },
{ word: "J.R.R. Tolkien", category: "Famous People", similar: ["C.S. Lewis", "George R.R. Martin", "Terry Pratchett"] },
{ word: "Stephen King", category: "Famous People", similar: ["Dean Koontz", "Peter Straub", "Clive Barker"] },
{ word: "Agatha Christie", category: "Famous People", similar: ["Arthur Conan Doyle", "Dorothy Sayers", "P.D. James"] },

// Musicians
{ word: "Mozart", category: "Famous People", similar: ["Beethoven", "Bach", "Chopin"] },
{ word: "Beethoven", category: "Famous People", similar: ["Mozart", "Schubert", "Brahms"] },
{ word: "Elvis Presley", category: "Famous People", similar: ["Chuck Berry", "Jerry Lee Lewis", "Buddy Holly"] },
{ word: "The Beatles", category: "Famous People", similar: ["The Rolling Stones", "The Who", "Led Zeppelin"] },
{ word: "Michael Jackson", category: "Famous People", similar: ["Prince", "Madonna", "Whitney Houston"] },
{ word: "David Bowie", category: "Famous People", similar: ["Elton John", "Freddie Mercury", "Iggy Pop"] },
{ word: "Freddie Mercury", category: "Famous People", similar: ["David Bowie", "Robert Plant", "Jim Morrison"] },
{ word: "Bob Dylan", category: "Famous People", similar: ["Paul Simon", "Woody Guthrie", "Joan Baez"] },
{ word: "Jimi Hendrix", category: "Famous People", similar: ["Eric Clapton", "Stevie Ray Vaughan", "Carlos Santana"] },
{ word: "Johnny Cash", category: "Famous People", similar: ["Waylon Jennings", "Merle Haggard", "Willie Nelson"] },

// Athletes
{ word: "Muhammad Ali", category: "Famous People", similar: ["Joe Frazier", "George Foreman", "Sugar Ray Leonard"] },
{ word: "Michael Jordan", category: "Famous People", similar: ["LeBron James", "Kobe Bryant", "Magic Johnson"] },
{ word: "Usain Bolt", category: "Famous People", similar: ["Carl Lewis", "Flo-Jo", "Michael Johnson"] },
{ word: "Pelé", category: "Famous People", similar: ["Diego Maradona", "Johan Cruyff", "Franz Beckenbauer"] },
{ word: "Serena Williams", category: "Famous People", similar: ["Steffi Graf", "Martina Navratilova", "Venus Williams"] },
{ word: "Tiger Woods", category: "Famous People", similar: ["Jack Nicklaus", "Arnold Palmer", "Phil Mickelson"] },
{ word: "Michael Phelps", category: "Famous People", similar: ["Mark Spitz", "Ian Thorpe", "Ryan Lochte"] },
{ word: "Babe Ruth", category: "Famous People", similar: ["Lou Gehrig", "Ty Cobb", "Joe DiMaggio"] },
{ word: "Wayne Gretzky", category: "Famous People", similar: ["Mario Lemieux", "Bobby Orr", "Gordie Howe"] },
{ word: "Ayrton Senna", category: "Famous People", similar: ["Michael Schumacher", "Alain Prost", "Niki Lauda"] },

// Modern Pop Culture Icons
{ word: "Elon Musk", category: "Famous People", similar: ["Jeff Bezos", "Steve Jobs", "Bill Gates"] },
{ word: "Steve Jobs", category: "Famous People", similar: ["Bill Gates", "Steve Wozniak", "Elon Musk"] },
{ word: "Oprah Winfrey", category: "Famous People", similar: ["Ellen DeGeneres", "Barbara Walters", "Diane Sawyer"] },
{ word: "Marilyn Monroe", category: "Famous People", similar: ["Audrey Hepburn", "Grace Kelly", "Elizabeth Taylor"] },
{ word: "Coco Chanel", category: "Famous People", similar: ["Yves Saint Laurent", "Christian Dior", "Gianni Versace"] },

// Books
{ word: "Frankenstein", category: "Books", similar: ["Dracula", "The Invisible Man", "Dr Jekyll and Mr Hyde"] },
{ word: "Moby Dick", category: "Books", similar: ["The Old Man and the Sea", "20,000 Leagues Under the Sea", "Robinson Crusoe"] },
{ word: "Treasure Island", category: "Books", similar: ["Robinson Crusoe", "Swiss Family Robinson", "Kidnapped"] },
{ word: "1984", category: "Books", similar: ["Brave New World", "Fahrenheit 451", "We"] },
{ word: "The Odyssey", category: "Books", similar: ["The Iliad", "The Aeneid", "Beowulf"] },
{ word: "Don Quixote", category: "Books", similar: ["Sancho Panza", "Candide", "Gulliver's Travels"] },
{ word: "Crime and Punishment", category: "Books", similar: ["The Brothers Karamazov", "Notes from Underground", "The Trial"] },

// Music
{ word: "Guitar", category: "Music", similar: ["Bass Guitar", "Ukulele", "Banjo"] },
{ word: "Drumkit", category: "Music", similar: ["Bongo Drums", "Congas", "Snare Drum"] },
{ word: "Violin", category: "Music", similar: ["Viola", "Cello", "Fiddle"] },
{ word: "Trumpet", category: "Music", similar: ["Trombone", "French Horn", "Bugle"] },
{ word: "Woodstock", category: "Music", similar: ["Coachella", "Glastonbury", "Lollapalooza"] },

// Places
{ word: "Eiffel Tower", category: "Places", similar: ["Arc de Triomphe", "Big Ben", "Leaning Tower of Pisa"] },
{ word: "Great Wall of China", category: "Places", similar: ["Hadrian's Wall", "Berlin Wall", "Maginot Line"] },
{ word: "Stonehenge", category: "Places", similar: ["Easter Island", "Avebury", "Carnac Stones"] },
{ word: "Niagara Falls", category: "Places", similar: ["Angel Falls", "Victoria Falls", "Iguazu Falls"] },
{ word: "Amazon Rainforest", category: "Places", similar: ["Congo Basin", "Daintree Rainforest", "Borneo"] },
{ word: "Mount Everest", category: "Places", similar: ["K2", "Kilimanjaro", "Mont Blanc"] },
{ word: "Bermuda Triangle", category: "Places", similar: ["Devil's Sea", "Sargasso Sea", "Dragon's Triangle"] },
{ word: "Area 51", category: "Places", similar: ["Roswell", "Dulce Base", "Wright-Patterson"] },
];

// Get a random word from the categorized list
export function getRandomWord(): string {
  return CATEGORIZED_WORDS[Math.floor(Math.random() * CATEGORIZED_WORDS.length)].word;
}

/**
 * Get a similar word for the impostor based on the actual word
 * Used in "impostor_gets_similar_word" game mode
 */
export function getSimilarWord(actualWord: string): string {
  const wordData = CATEGORIZED_WORDS.find(
    (w) => w.word.toLowerCase() === actualWord.toLowerCase()
  );
  
  if (!wordData || !wordData.similar || wordData.similar.length === 0) {
    // Fallback: return a random word from the same category if available
    const sameCategory = CATEGORIZED_WORDS.filter(
      (w) => w.category === wordData?.category && w.word !== actualWord
    );
    
    if (sameCategory.length > 0) {
      return sameCategory[Math.floor(Math.random() * sameCategory.length)].word;
    }
    
    // Ultimate fallback: return any random word
    return getRandomWord();
  }
  
  // Return a random similar word
  return wordData.similar[Math.floor(Math.random() * wordData.similar.length)];
}

/**
 * Get the word that a player should see
 * For impostors in "impostor_gets_similar_word" mode, returns the fake word
 * For others, returns the actual word
 */
export function getPlayerWord(
  actualWord: string,
  isImpostor: boolean,
  impostorWord?: string
): string {
  if (isImpostor) {
    return impostorWord || "?";
  }
  return actualWord;
}

// Get a random word, avoiding the current word when possible.
export function getRandomWordExcept(currentWord: string): string {
  const availableWords = CATEGORIZED_WORDS.filter(
    (wordData) => wordData.word.toLowerCase() !== currentWord.toLowerCase()
  );

  const wordPool = availableWords.length > 0 ? availableWords : CATEGORIZED_WORDS;
  return wordPool[Math.floor(Math.random() * wordPool.length)].word;
}

// Get all public word lists
export async function getPublicWordLists(): Promise<WordList[]> {
  const wordListsRef = collection(db, "wordLists");
  const q = query(wordListsRef, where("isPublic", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as WordList));
}

// Create a custom word list
export async function createWordList(
  userId: string,
  name: string,
  words: string[],
  isPublic: boolean = false
): Promise<string> {
  const wordListRef = doc(collection(db, "wordLists"));
  const wordListId = wordListRef.id;

  const newWordList: WordList = {
    id: wordListId,
    name,
    createdBy: userId,
    isPublic,
    words,
    createdAt: Date.now(),
  };

  await setDoc(wordListRef, newWordList);
  return wordListId;
}

// Get a specific word list
export async function getWordList(wordListId: string): Promise<WordList | null> {
  const docSnap = await getDoc(doc(db, "wordLists", wordListId));
  return docSnap.exists() ? (docSnap.data() as WordList) : null;
}

// Get random word from a word list
export async function getRandomWordFromList(wordListId: string): Promise<string> {
  const wordList = await getWordList(wordListId);
  if (!wordList) return getRandomWord();
  return wordList.words[Math.floor(Math.random() * wordList.words.length)];
}
