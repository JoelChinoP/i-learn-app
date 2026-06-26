insert into public.sections(id, name, class_code, active)
values ('00000000-0000-4000-8000-000000000001', 'Matemática Demo', 'MAT-DEMO-2026', true)
on conflict (id) do update set name = excluded.name, class_code = excluded.class_code, active = true;

insert into public.questions(
  id, section_id, topic, difficulty_level, prompt, question_type, options,
  correct_answer, expected_answer_or_rubric, knowledge_tags, sequence
) values
('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','Fracciones',2,'¿Cuál es el resultado de 3/4 + 1/2?','opcion_multiple','["5/4","4/6","1","5/6"]','5/4','Debe convertir 1/2 a 2/4 y sumar 3/4 + 2/4 = 5/4.',array['fractions','common-denominator','addition'],1),
('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','Fracciones',1,'Simplifica la fracción 6/8.','texto_libre',null,'3/4','La respuesta equivalente esperada es 3/4; debe dividir numerador y denominador entre 2.',array['fractions','simplification','equivalent-fractions'],2),
('10000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','Fracciones',3,'¿Cuánto es 2/3 de 12?','opcion_multiple','["6","8","9","10"]','8','Debe multiplicar 12 por 2 y dividir entre 3.',array['fractions','fraction-of-number','multiplication'],3),
('10000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000001','Números enteros',1,'¿Cuál es el resultado de -4 + 7?','opcion_multiple','["-11","-3","3","11"]','3','Al avanzar siete unidades desde -4 se llega a 3.',array['integers','addition','number-line'],4),
('10000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000001','Números enteros',2,'Explica por qué el producto de dos números negativos es positivo.','texto_libre',null,'positivo','Debe explicar la regla de signos o usar un patrón coherente de multiplicación.',array['integers','multiplication','sign-rules'],5),
('10000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000001','Números enteros',2,'Ordena de menor a mayor: 2, -5, 0, -1.','opcion_multiple','["-5, -1, 0, 2","-1, -5, 0, 2","2, 0, -1, -5","-5, 0, -1, 2"]','-5, -1, 0, 2','Los números más alejados a la izquierda en la recta numérica son menores.',array['integers','ordering','number-line'],6),
('10000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000001','Geometría',1,'¿Cuántos grados suman los ángulos interiores de un triángulo?','opcion_multiple','["90°","180°","270°","360°"]','180°','La suma de los ángulos interiores de todo triángulo es 180 grados.',array['geometry','triangles','angles'],7),
('10000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000001','Geometría',2,'Calcula el perímetro de un rectángulo de 5 cm por 3 cm.','texto_libre',null,'16 cm','Debe aplicar 2 × (5 + 3) = 16 cm.',array['geometry','rectangle','perimeter'],8),
('10000000-0000-4000-8000-000000000009','00000000-0000-4000-8000-000000000001','Geometría',2,'¿Cuál es el área de un cuadrado de lado 6 cm?','opcion_multiple','["12 cm²","24 cm²","36 cm²","48 cm²"]','36 cm²','El área de un cuadrado es lado por lado: 6 × 6.',array['geometry','square','area'],9),
('10000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000001','Decimales',1,'¿Cuál es el resultado de 1.5 + 0.75?','opcion_multiple','["1.80","2.15","2.25","2.75"]','2.25','Debe alinear las posiciones decimales y sumar.',array['decimals','addition','place-value'],10),
('10000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000001','Decimales',2,'Escribe 0.4 como fracción simplificada.','texto_libre',null,'2/5','0.4 equivale a 4/10 y se simplifica a 2/5.',array['decimals','fractions','conversion'],11),
('10000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000001','Decimales',2,'¿Qué número es mayor?','opcion_multiple','["0.58","0.6","Son iguales","No se puede saber"]','0.6','0.6 equivale a 0.60, que es mayor que 0.58.',array['decimals','comparison','place-value'],12),
('10000000-0000-4000-8000-000000000013','00000000-0000-4000-8000-000000000001','Porcentajes',1,'¿Cuánto es el 25% de 80?','opcion_multiple','["15","20","25","40"]','20','25% equivale a 1/4 y la cuarta parte de 80 es 20.',array['percentages','fraction-of-number','proportion'],13),
('10000000-0000-4000-8000-000000000014','00000000-0000-4000-8000-000000000001','Porcentajes',2,'Un producto cuesta S/ 100 y tiene 15% de descuento. ¿Cuál es el precio final?','texto_libre',null,'S/ 85','Debe calcular 15% de 100 y restarlo: 100 - 15 = 85.',array['percentages','discount','word-problem'],14),
('10000000-0000-4000-8000-000000000015','00000000-0000-4000-8000-000000000001','Porcentajes',2,'¿Qué porcentaje representa 3 de 12?','opcion_multiple','["20%","25%","30%","40%"]','25%','3/12 se simplifica a 1/4, equivalente a 25%.',array['percentages','ratio','conversion'],15)
on conflict (id) do update set
  prompt = excluded.prompt, question_type = excluded.question_type, options = excluded.options,
  correct_answer = excluded.correct_answer, expected_answer_or_rubric = excluded.expected_answer_or_rubric,
  knowledge_tags = excluded.knowledge_tags, sequence = excluded.sequence, active = true;

insert into public.knowledge_embeddings(id, question_id, content, embedding_text, embedding_status) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Para sumar fracciones con distinto denominador, conviértelas a fracciones equivalentes con un denominador común y luego suma los numeradores.','fractions addition common denominator equivalent fractions numerator denominator','pending'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Una fracción se simplifica dividiendo numerador y denominador por el mismo factor común hasta que no compartan divisores.','fractions simplification greatest common factor equivalent fraction','pending'),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000004','En la recta numérica, sumar un positivo desplaza hacia la derecha y sumar un negativo desplaza hacia la izquierda.','integers addition subtraction number line positive negative','pending'),
('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000005','En multiplicación y división, signos iguales producen un resultado positivo y signos diferentes producen uno negativo.','integers multiplication division sign rules positive negative','pending'),
('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000007','Los ángulos interiores de un triángulo siempre suman 180 grados, sin importar su forma.','geometry triangle interior angles sum 180 degrees','pending'),
('20000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000008','El perímetro mide el contorno de una figura. Para un rectángulo se suman dos largos y dos anchos.','geometry rectangle perimeter length width formula','pending'),
('20000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000010','Al sumar decimales se alinean las comas o puntos decimales para que unidades, décimos y centésimos queden en la misma columna.','decimals addition align decimal point place value','pending'),
('20000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000011','Un decimal puede convertirse en fracción usando potencias de diez como denominador y simplificando después.','decimals fractions conversion tenths hundredths simplify','pending'),
('20000000-0000-4000-8000-000000000009','10000000-0000-4000-8000-000000000013','Un porcentaje expresa una cantidad de cada cien. Puede convertirse a fracción o decimal antes de multiplicar por el total.','percentages percent of number fraction decimal proportion','pending'),
('20000000-0000-4000-8000-000000000010','10000000-0000-4000-8000-000000000014','Para aplicar un descuento, calcula el porcentaje del precio original y resta esa cantidad al precio.','percentages discount original price final price word problem','pending')
on conflict (id) do update set
  content = excluded.content, embedding_text = excluded.embedding_text,
  embedding = null, embedding_status = 'pending', embedding_error = null;
