export interface NamedPerson {
  name: string
  gender: 'm' | 'f'
}

// 20 male + 20 female per starting letter (variety across generated levels).
const MALE: Record<string, string[]> = {
  A: ['Alex', 'Amir', 'Anton', 'Adrian', 'Aaron', 'Albert', 'Andre', 'Arne', 'Aziz', 'Achim', 'Armin', 'Axel', 'Arda', 'Aleks', 'Arno', 'August', 'Anselm', 'Artur', 'Aron', 'Ahmet'],
  B: ['Bernd', 'Boris', 'Bruno', 'Bastian', 'Bilal', 'Bernhard', 'Bjarne', 'Benno', 'Bela', 'Benedikt', 'Bodo', 'Berkay', 'Bent', 'Burak', 'Balthasar', 'Bram', 'Bo', 'Bennet', 'Ben', 'Baran'],
  C: ['Cyrus', 'Carl', 'Curtis', 'Christian', 'Conor', 'Cedric', 'Cem', 'Claudio', 'Cornelius', 'Connor', 'Caspar', 'Can', 'Carlo', 'Colin', 'Constantin', 'Chris', 'Carsten', 'Cassius', 'Cliff', 'Cetin'],
  D: ['Dylan', 'Dean', 'Dominik', 'David', 'Dario', 'Denis', 'Dirk', 'Damian', 'Diego', 'Daniel', 'Deniz', 'Devin', 'Dustin', 'Darius', 'Dragan', 'Dorian', 'Dmitri', 'Dennis', 'Detlef', 'Dino'],
  E: ['Edison', 'Emil', 'Erik', 'Elias', 'Enzo', 'Eric', 'Eduard', 'Efe', 'Egon', 'Ewald', 'Emre', 'Ernst', 'Elmar', 'Eren', 'Edgar', 'Edmund', 'Elliot', 'Elia', 'Eberhard', 'Emin'],
  F: ['Floyd', 'Finn', 'Felix', 'Frank', 'Fabian', 'Ferdinand', 'Florian', 'Faruk', 'Falk', 'Fritz', 'Frederik', 'Fynn', 'Furkan', 'Friedrich', 'Fabio', 'Ferris', 'Flavio', 'Folke', 'Fred', 'Faris'],
  G: ['Grant', 'George', 'Gustav', 'Georg', 'Gabriel', 'Gino', 'Guenther', 'Gregor', 'Gerd', 'Glenn', 'Gideon', 'Gerald', 'Goran', 'Gunnar', 'Gerrit', 'Gilbert', 'Gael', 'Gerwin', 'Gavin', 'Giorgio'],
  H: ['Hugh', 'Hektor', 'Henry', 'Hassan', 'Hans', 'Hugo', 'Harald', 'Holger', 'Heiko', 'Hannes', 'Hendrik', 'Hakan', 'Hamza', 'Heinrich', 'Helmut', 'Herbert', 'Horst', 'Halil', 'Hagen', 'Henrik'],
  I: ['Ivan', 'Igor', 'Ian', 'Ibrahim', 'Ingo', 'Ismael', 'Ilias', 'Imre', 'Inigo', 'Iwan', 'Idris', 'Ilja', 'Immo', 'Ingmar', 'Ilyas', 'Iker', 'Ilan', 'Iago', 'Iordan', 'Ismet'],
  J: ['Jonas', 'Jasper', 'Joel', 'Jan', 'Julian', 'Jakob', 'Jamal', 'Jens', 'Johann', 'Jermaine', 'Joscha', 'Jaron', 'Joris', 'Janosch', 'Justus', 'Jean', 'Jonte', 'Jarne', 'Joost', 'Jamie'],
  K: ['Kai', 'Kurt', 'Karl', 'Konrad', 'Kevin', 'Kilian', 'Kerem', 'Klaus', 'Kjell', 'Kofi', 'Kaspar', 'Kenan', 'Kristian', 'Knut', 'Karsten', 'Kolja', 'Kian', 'Korbinian', 'Krishna', 'Kerim'],
  L: ['Liam', 'Leon', 'Lukas', 'Lars', 'Lennart', 'Levi', 'Luca', 'Linus', 'Leandro', 'Ludwig', 'Lasse', 'Len', 'Laurin', 'Lio', 'Lennox', 'Loris', 'Lorenz', 'Lothar', 'Luan', 'Lewis'],
}

const FEMALE: Record<string, string[]> = {
  A: ['Anna', 'Aria', 'Amelie', 'Alina', 'Astrid', 'Anja', 'Aylin', 'Anke', 'Ada', 'Antonia', 'Alma', 'Annika', 'Asya', 'Agnes', 'Amira', 'Anouk', 'Aurora', 'Alicia', 'Adriana', 'Alva'],
  B: ['Bella', 'Bea', 'Bianca', 'Brenda', 'Birgit', 'Berta', 'Bahar', 'Bettina', 'Bianka', 'Brigitte', 'Britta', 'Beatrix', 'Belinda', 'Bente', 'Bojana', 'Beyza', 'Birte', 'Blanka', 'Bobbie', 'Brunhild'],
  C: ['Carol', 'Cleo', 'Clara', 'Chiara', 'Carla', 'Celine', 'Catrin', 'Cora', 'Cynthia', 'Constanze', 'Cecilia', 'Charlotte', 'Cilia', 'Carmen', 'Cira', 'Coco', 'Caren', 'Carina', 'Camille', 'Cathy'],
  D: ['Dalia', 'Dora', 'Diana', 'Daphne', 'Dana', 'Doreen', 'Delia', 'Dunja', 'Denise', 'Dilara', 'Doris', 'Dagmar', 'Daniela', 'Dilan', 'Dominika', 'Dorothea', 'Daria', 'Debbie', 'Diane', 'Dilek'],
  E: ['Elsa', 'Eva', 'Ella', 'Emma', 'Elena', 'Edith', 'Esra', 'Erna', 'Elif', 'Emilia', 'Erika', 'Elke', 'Esther', 'Evelyn', 'Enie', 'Ebru', 'Eda', 'Eleonora', 'Emily', 'Elvira'],
  F: ['Freya', 'Fay', 'Fiona', 'Frieda', 'Franka', 'Femke', 'Fatima', 'Fina', 'Flora', 'Franziska', 'Frida', 'Felicia', 'Fenja', 'Fee', 'Filippa', 'Florentine', 'Fabienne', 'Funda', 'Faye', 'Finja'],
  G: ['Greta', 'Gwen', 'Gina', 'Gloria', 'Gisela', 'Gerda', 'Grace', 'Galina', 'Gabriele', 'Gerlinde', 'Gundula', 'Giada', 'Genoveva', 'Goldie', 'Gita', 'Geraldine', 'Giselle', 'Greer', 'Guendalina', 'Gunda'],
  H: ['Hana', 'Holly', 'Heidi', 'Helena', 'Hannah', 'Hedda', 'Huelya', 'Helga', 'Hilde', 'Henrike', 'Hanna', 'Hatice', 'Hermine', 'Heike', 'Helene', 'Hella', 'Henna', 'Hilda', 'Honey', 'Hannelore'],
  I: ['Iris', 'Ines', 'Ida', 'Isabel', 'Ilka', 'Ira', 'Imke', 'Indira', 'Iona', 'Ingrid', 'Ilse', 'Irmgard', 'Ilayda', 'Isolde', 'Ivana', 'Inga', 'Irina', 'Isabella', 'Idun', 'Iben'],
  J: ['Jana', 'Julia', 'Joana', 'Jasmin', 'Jette', 'Johanna', 'Judith', 'Juna', 'Jolanda', 'Janne', 'Josefine', 'Juliane', 'Jolie', 'Jade', 'Jenny', 'Jara', 'Joline', 'Jutta', 'Jasmina', 'Joyce'],
  K: ['Kira', 'Kim', 'Kara', 'Klara', 'Katja', 'Karin', 'Kerstin', 'Kaja', 'Kayra', 'Kornelia', 'Katharina', 'Katrin', 'Keziah', 'Kyra', 'Kunigunde', 'Karla', 'Kaori', 'Kelly', 'Kalea', 'Kassandra'],
  L: ['Lena', 'Lia', 'Luisa', 'Lara', 'Lina', 'Leonie', 'Lotte', 'Layla', 'Lilly', 'Linda', 'Lisa', 'Liv', 'Leandra', 'Lou', 'Lale', 'Larissa', 'Leila', 'Luna', 'Ludmilla', 'Liana'],
}

// Victims always start with V (≥20).
const VICTIMS: NamedPerson[] = [
  m('Viktor'), m('Viraj'), m('Vincent'), m('Valentin'), m('Vito'), m('Vasiliy'),
  m('Vlad'), m('Veit'), m('Volker'), m('Victor'), m('Vivek'), m('Vidal'),
  f('Vicky'), f('Vera'), f('Vanessa'), f('Valentina'), f('Viola'), f('Vivian'),
  f('Verena'), f('Valerie'), f('Veronika'), f('Victoria'), f('Vita'), f('Vesna'),
]

function m(name: string): NamedPerson {
  return { name, gender: 'm' }
}
function f(name: string): NamedPerson {
  return { name, gender: 'f' }
}

/** A distinct named person for each suspect index (0 = A, 1 = B, …). */
export function suspectPerson(index: number, gender: 'm' | 'f', used: Set<string>): NamedPerson {
  const letter = String.fromCharCode(65 + index)
  const bank = (gender === 'm' ? MALE : FEMALE)[letter] ?? [letter + index]
  for (const name of bank) {
    if (!used.has(name)) {
      used.add(name)
      return { name, gender }
    }
  }
  return { name: letter + index, gender }
}

export function victimPerson(rng: { int(max: number): number }): NamedPerson {
  return VICTIMS[rng.int(VICTIMS.length)]
}
