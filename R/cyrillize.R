
library('stringi')

cyrillize <- function(text){
	return(stri_trans_general(text, 'cyrillic'))
}

latinize <- function(text){
	return(stri_trans_general(text, 'latin'))
}
